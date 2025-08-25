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

  const isFormValid = useMemo(() => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) return false;
      if (formType === 'transfer') return fromAccountId && toAccountId && fromAccountId !== toAccountId;
      return description && category && date;
  }, [amount, formType, fromAccountId, toAccountId, description, category, date]);

  if (!isOpen) return null;
  
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-modalFadeIn" onClick={onClose}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-modalFadeIn { animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-modalSlideUp { animation: modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
      
       <div className="bg-zinc-900 w-full max-w-lg rounded-t-2xl shadow-lg flex flex-col h-[90dvh] animate-modalSlideUp" onClick={(e) => e.stopPropagation()}>
          <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-700/60">
              <h2 className="text-xl font-bold">{isEditMode ? 'Transaktion bearbeiten' : 'Neue Transaktion'}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center -m-2 rounded-full hover:bg-zinc-700/50"><Icon name="close" /></button>
          </header>

          <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-3 bg-zinc-800 rounded-lg p-1 gap-1">
                      <button type="button" onClick={() => setFormType('expense')} disabled={isEditMode} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'expense' ? 'bg-red-500/80 text-white' : 'text-zinc-400 hover:bg-zinc-700 disabled:opacity-50'}`}>Ausgabe</button>
                      <button type="button" onClick={() => setFormType('income')} disabled={isEditMode} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'income' ? 'bg-green-500/80 text-white' : 'text-zinc-400 hover:bg-zinc-700 disabled:opacity-50'}`}>Einnahme</button>
                      <button type="button" onClick={() => setFormType('transfer')} disabled={isEditMode} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'transfer' ? 'bg-blue-500/80 text-white' : 'text-zinc-400 hover:bg-zinc-700 disabled:opacity-50'}`}>Übertrag</button>
                  </div>

                  {formType === 'transfer' ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fromAccount" className="block text-sm font-medium text-zinc-300 mb-1">Von Konto</label>
                            <select id="fromAccount" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none">
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="toAccount" className="block text-sm font-medium text-zinc-300 mb-1">Auf Konto</label>
                            <select id="toAccount" value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none">
                                {accounts.filter(a => a.id !== fromAccountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Beschreibung</label>
                            <textarea 
                                ref={descriptionTextareaRef}
                                id="description" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                required 
                                placeholder="z.B. Wocheneinkauf" 
                                rows={1} 
                                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none overflow-y-hidden leading-relaxed" 
                            />
                        </div>
                        <div className="relative">
                           <CategoryInput value={category} onChange={setCategory} allCategories={formType === 'income' ? categories.income : categories.expense} />
                       </div>
                    </div>
                  )}
                   <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-1">Betrag (€)</label>
                        <input type="text" inputMode="decimal" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0,00" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Datum</label>
                        <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
              </div>
              
              <div className="flex-shrink-0 p-4 border-t border-zinc-700/60 flex items-center gap-3">
                  {isEditMode && (
                      <button
                          type="button"
                          onClick={handleDelete}
                          className="flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-red-500"
                          aria-label="Transaktion löschen"
                      >
                          <Icon name="delete" />
                          <span>Löschen</span>
                      </button>
                  )}
                  <button type="submit" disabled={!isFormValid} className="flex-grow w-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500">
                      {isEditMode ? 'Änderungen speichern' : 'Speichern'}
                  </button>
              </div>
          </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;