import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useApp } from '../AuriMeaApp';
import { Transaction } from '../types';
import Icon from './Icon';

interface CategoryInputProps {
    value: string;
    onChange: (value: string) => void;
    allCategories: string[];
}

const CategoryInput: React.FC<CategoryInputProps> = ({ value, onChange, allCategories }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isListOpen, setIsListOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setInputValue(value); }, [value]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsListOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCategories = useMemo(() => {
        if (!inputValue) return allCategories;
        return allCategories.filter(cat => cat.toLowerCase().includes(inputValue.toLowerCase()));
    }, [inputValue, allCategories]);

    const handleSelectCategory = (category: string) => {
        setInputValue(category);
        onChange(category);
        setIsListOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-1">Kategorie</label>
            <input
                type="text" id="category" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsListOpen(true)}
                onBlur={() => onChange(inputValue)}
                required placeholder="z.B. Lebensmittel" autoComplete="off"
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {isListOpen && filteredCategories.length > 0 && (
                <ul className="absolute z-50 w-full bg-zinc-800 border border-zinc-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg top-full">
                    {filteredCategories.map(cat => (
                        <li key={cat}>
                            <button type="button" onClick={() => handleSelectCategory(cat)} className="w-full text-left px-4 py-2 text-zinc-200 hover:bg-violet-500/20">
                                {cat}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, transactionToEdit }) => {
  const { accounts, activeAccountId, categories, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const [formType, setFormType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [fromAccountId, setFromAccountId] = useState(activeAccountId);
  const [toAccountId, setToAccountId] = useState('');
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditMode = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && transactionToEdit) {
            setFormType(transactionToEdit.type);
            setDescription(transactionToEdit.description);
            setAmount(transactionToEdit.amount.toString().replace('.', ','));
            setDate(new Date(transactionToEdit.createdAt).toISOString().split('T')[0]);
            setCategory(transactionToEdit.category || '');
            setFromAccountId(transactionToEdit.accountId);
        } else {
            setFormType('expense');
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('');
            setFromAccountId(activeAccountId);
            const otherAccount = accounts.find(acc => acc.id !== activeAccountId);
            setToAccountId(otherAccount ? otherAccount.id : '');
        }
    }
  }, [isOpen, isEditMode, transactionToEdit, activeAccountId, accounts]);
  
  useLayoutEffect(() => {
    const textarea = descriptionTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'inherit';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [description]);


  useEffect(() => { setCategory(''); }, [formType]);
  useEffect(() => { if (fromAccountId === toAccountId) setToAccountId(accounts.find(acc => acc.id !== fromAccountId)?.id || ''); }, [fromAccountId, toAccountId, accounts]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    
    if (formType === 'transfer') {
        addTransaction(
            { type: 'expense', accountId: fromAccountId, amount: parsedAmount, description: `An ${accounts.find(a=>a.id===toAccountId)?.name}`, category: 'Transfer', createdAt: new Date(date).toISOString() },
            { type: 'income', accountId: toAccountId, amount: parsedAmount, description: `Von ${accounts.find(a=>a.id===fromAccountId)?.name}`, category: 'Transfer', createdAt: new Date(date).toISOString() }
        );
    } else {
        const transactionData = { type: formType, description, amount: parsedAmount, category, createdAt: new Date(date).toISOString(), accountId: fromAccountId };
        if (isEditMode && transactionToEdit) {
            updateTransaction({ ...transactionData, id: transactionToEdit.id });
        } else {
            addTransaction(transactionData);
        }
    }
    onClose();
  };

  const handleDelete = () => {
      if (transactionToEdit) {
          onClose();
          deleteTransaction(transactionToEdit.id);
      }
  };

  // FIX: Completed the validation logic which was truncated in the original file.
  const isFormValid = useMemo(() => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0 || !date) return false;

      if (formType === 'transfer') {
          return fromAccountId && toAccountId && fromAccountId !== toAccountId;
      } else {
          return description.trim() !== '' && category.trim() !== '';
      }
  }, [amount, date, formType, fromAccountId, toAccountId, description, category]);

  if (!isOpen) return null;

  const modalTitle = isEditMode ? 'Transaktion bearbeiten' : 'Neue Transaktion';

  // FIX: Added the missing JSX return to make this a valid React component.
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
            .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
        `}</style>
        <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn h-[90vh] max-h-[700px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold">{modalTitle}</h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center -m-1"><Icon name="close" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-4">
                    <div className="grid grid-cols-3 bg-zinc-800 rounded-lg p-1 gap-1">
                        <button type="button" onClick={() => setFormType('expense')} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'expense' ? 'bg-red-500/50 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Ausgabe</button>
                        <button type="button" onClick={() => setFormType('income')} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'income' ? 'bg-green-500/50 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Einnahme</button>
                        <button type="button" onClick={() => setFormType('transfer')} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'transfer' ? 'bg-blue-500/50 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Überweisung</button>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-1">Betrag</label>
                            <input type="text" inputMode="decimal" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0,00" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Datum</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white" />
                        </div>
                    </div>
                    
                    {formType === 'transfer' ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fromAccount" className="block text-sm font-medium text-zinc-300 mb-1">Von</label>
                                <select id="fromAccount" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="toAccount" className="block text-sm font-medium text-zinc-300 mb-1">Nach</label>
                                <select id="toAccount" value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {accounts.filter(acc => acc.id !== fromAccountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Beschreibung</label>
                                <textarea ref={descriptionTextareaRef} id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="z.B. Wocheneinkauf" rows={1} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none overflow-hidden" />
                            </div>
                            <CategoryInput
                                value={category}
                                onChange={setCategory}
                                allCategories={categories[formType]}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-auto flex-shrink-0 flex items-center gap-3">
                    {isEditMode && formType !== 'transfer' && (
                        <button type="button" onClick={handleDelete} className="bg-red-900/40 hover:bg-red-900/60 text-red-300 font-bold p-3 rounded-lg">
                            <Icon name="delete" />
                        </button>
                    )}
                    <button type="submit" disabled={!isFormValid} className="flex-1 bg-violet-600 disabled:bg-zinc-600 text-white font-bold py-3 px-4 rounded-lg">
                        {isEditMode ? 'Änderungen speichern' : 'Hinzufügen'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

// FIX: Added default export to resolve module import error.
export default TransactionFormModal;
