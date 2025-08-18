

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Account, TransactionTemplate } from '../types';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  transactionToEdit?: Transaction | null;
  onSave: (transaction: Omit<Transaction, 'id' | 'accountId' | 'transferId'>, id?: string) => void;
  onSaveTransfer: (data: { fromAccountId: string; toAccountId: string; amount: number; description: string, date: string }) => void;
  accounts: Account[];
  activeAccountId: string;
  categories: { income: string[], expense: string[] };
  templates: TransactionTemplate[];
  onSaveTemplate: (template: Omit<TransactionTemplate, 'id'>) => void;
  onDeleteTemplate: (id: string) => void;
}

const CategoryInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    allCategories: string[];
}> = ({ value, onChange, allCategories }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isListOpen, setIsListOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsListOpen(false);
                onChange(inputValue); // Commit the value on blur
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputValue, onChange]);

    const filteredCategories = useMemo(() => {
        if (!inputValue) return allCategories;
        return allCategories.filter(cat =>
            cat.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [inputValue, allCategories]);

    const handleSelectCategory = (category: string) => {
        setInputValue(category);
        onChange(category);
        setIsListOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-1">Kategorie</label>
            <input
                type="text"
                id="category"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsListOpen(true)}
                required
                placeholder="z.B. Lebensmittel"
                autoComplete="off"
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {isListOpen && filteredCategories.length > 0 && (
                <ul className="absolute z-10 w-full bg-zinc-800 border border-zinc-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredCategories.map(cat => (
                        <li key={cat}>
                            <button
                                type="button"
                                onClick={() => handleSelectCategory(cat)}
                                className="w-full text-left px-4 py-2 text-zinc-200 hover:bg-violet-500/20"
                            >
                                {cat}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
    isOpen,
    onClose,
    mode,
    transactionToEdit,
    onSave,
    onSaveTransfer,
    accounts,
    activeAccountId,
    categories,
    templates,
    onSaveTemplate,
    onDeleteTemplate
}) => {
  const [formType, setFormType] = useState<'expense' | 'income' | 'transfer'>('expense');
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [fromAccountId, setFromAccountId] = useState(activeAccountId);
  const [toAccountId, setToAccountId] = useState('');

  const isEditMode = mode === 'edit' && !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && transactionToEdit) {
            setFormType(transactionToEdit.type);
            setDescription(transactionToEdit.description);
            setAmount(transactionToEdit.amount.toString());
            setDate(new Date(transactionToEdit.createdAt).toISOString().split('T')[0]);
            setCategory(transactionToEdit.category || '');
        } else {
            // Reset form for 'add' mode
            setFormType('expense');
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('');
            setFromAccountId(activeAccountId);
            const otherAccounts = accounts.filter(acc => acc.id !== activeAccountId);
            setToAccountId(otherAccounts.length > 0 ? otherAccounts[0].id : '');
        }
    }
  }, [isOpen, isEditMode, transactionToEdit, activeAccountId, accounts]);
  
  // When switching form type, reset category
  useEffect(() => {
      if (!isEditMode) { // only for new transactions
          setCategory('');
      }
  }, [formType, isEditMode]);


  useEffect(() => {
    if (fromAccountId === toAccountId && accounts.length > 1) {
      setToAccountId(accounts.find(acc => acc.id !== fromAccountId)?.id || '');
    }
  }, [fromAccountId, toAccountId, accounts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(',', '.');
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(sanitizedValue)) {
        setAmount(value); // Keep user's comma if they want
    }
  };

  const handleSaveAsTemplate = (e: React.MouseEvent) => {
      e.preventDefault();
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (description && parsedAmount > 0 && category && formType !== 'transfer') {
        onSaveTemplate({
            type: formType,
            description,
            amount: parsedAmount,
            category
        });
        alert(`Vorlage "${description}" gespeichert.`);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    
    if (formType === 'transfer') {
        if (fromAccountId && toAccountId && parsedAmount > 0 && fromAccountId !== toAccountId) {
            onSaveTransfer({
                fromAccountId,
                toAccountId,
                amount: parsedAmount,
                description: description || 'Kontotransfer',
                date,
            });
        }
    } else {
        if(description && parsedAmount > 0 && category && date) {
            const [year, month, day] = date.split('-').map(Number);
            const finalDate = isEditMode && transactionToEdit ? new Date(transactionToEdit.createdAt) : new Date();
            finalDate.setFullYear(year, month - 1, day);
            finalDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
            
            onSave(
                {
                    type: formType,
                    description,
                    amount: parsedAmount,
                    category,
                    createdAt: finalDate.toISOString(),
                },
                isEditMode ? transactionToEdit.id : undefined
            );
        }
    }
  };

  if (!isOpen) return null;
  
  const modalTitle = isEditMode ? 'Transaktion bearbeiten' : 'Neue Transaktion';

  const isFormValid = (() => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) return false;
      if (formType === 'transfer') {
          return fromAccountId && toAccountId && fromAccountId !== toAccountId;
      }
      return description && category;
  })();

  const isTemplateFormValid = (() => {
      if (isEditMode || formType === 'transfer') return false;
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) return false;
      return description && category;
  })();
  
  const otherAccounts = accounts.filter(acc => acc.id !== fromAccountId);
  
  const availableCategories = formType === 'income' ? categories.income : categories.expense;
  const filteredTemplates = templates.filter(t => t.type === formType);

  const handleSelectTemplate = (template: TransactionTemplate) => {
      setDescription(template.description);
      setAmount(template.amount.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\./g, ''));
      setCategory(template.category);
  };

  const renderIncomeExpenseFields = () => (
    <>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-1">Betrag (€)</label>
        <input type="text" inputMode="decimal" id="amount" value={amount} onChange={handleAmountChange} required placeholder="0,00" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
      <CategoryInput value={category} onChange={setCategory} allCategories={availableCategories} />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Beschreibung</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="z.B. Wocheneinkauf" rows={3} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Datum</label>
        <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
    </>
  );

  const renderTransferFields = () => (
      <>
        <div>
          <label htmlFor="fromAccount" className="block text-sm font-medium text-zinc-300 mb-1">Von Konto</label>
          <select id="fromAccount" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none">
             {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="toAccount" className="block text-sm font-medium text-zinc-300 mb-1">Auf Konto</label>
          <select id="toAccount" value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none" required>
            {otherAccounts.length === 0 && <option value="" disabled>Kein anderes Konto verfügbar</option>}
            {otherAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="transferAmount" className="block text-sm font-medium text-zinc-300 mb-1">Betrag (€)</label>
          <input type="text" inputMode="decimal" id="transferAmount" value={amount} onChange={handleAmountChange} required placeholder="0,00" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Datum</label>
          <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
         <div>
            <label htmlFor="transferDescription" className="block text-sm font-medium text-zinc-300 mb-1">Beschreibung (Optional)</label>
            <input type="text" id="transferDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="z.B. Ersparnisse" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-form-modal-title"
      className="fixed inset-0 z-50 flex flex-col bg-zinc-900 p-4 text-zinc-100 animate-fadeInUp"
    >
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
      
      <header className="flex-shrink-0 flex justify-between items-center pb-4 mb-4 border-b border-zinc-700/60">
          <h2 id="transaction-form-modal-title" className="text-xl font-bold text-zinc-100">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors rounded-full p-2 -m-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
            aria-label="Modal schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
          <div className="flex-grow overflow-y-auto pl-1 pr-2 -mr-2 space-y-4">
              <div className="grid grid-cols-3 bg-zinc-800 rounded-lg p-1 gap-1">
                  <button type="button" onClick={() => setFormType('expense')} disabled={isEditMode} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'expense' ? 'bg-red-500/80 text-white' : 'text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'}`}>Ausgabe</button>
                  <button type="button" onClick={() => setFormType('income')} disabled={isEditMode} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'income' ? 'bg-green-500/80 text-white' : 'text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'}`}>Einnahme</button>
                  <button type="button" onClick={() => setFormType('transfer')} disabled={isEditMode} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'transfer' ? 'bg-blue-500/80 text-white' : 'text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'}`}>Übertrag</button>
              </div>

              {formType === 'transfer' ? renderTransferFields() : renderIncomeExpenseFields()}
            
              {!isEditMode && formType !== 'transfer' && (
                <div className="pt-2">
                    <p className="text-sm text-zinc-400 mb-2">Vorlagen</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredTemplates.length > 0 ? (
                            filteredTemplates.map(template => (
                                <div key={template.id} className="relative group/template">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectTemplate(template)}
                                        className="w-full h-full text-left p-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 flex flex-col justify-between"
                                        style={{minHeight: '100px'}}
                                    >
                                        <p className="font-semibold text-zinc-200 text-sm line-clamp-2">{template.description}</p>
                                        <div className="mt-2">
                                            <p className={`text-lg font-bold ${template.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                                {template.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate">{template.category}</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteTemplate(template.id)}
                                        aria-label={`Vorlage ${template.description} löschen`}
                                        className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-red-400 bg-zinc-800/50 hover:bg-red-500/20 rounded-full opacity-0 group-hover/template:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-zinc-500 italic col-span-2 sm:col-span-3">Keine Vorlagen für diesen Typ vorhanden.</p>
                        )}
                    </div>
                </div>
              )}
          </div>
          
          <div className="flex-shrink-0 pt-6 space-y-3">
              {!isEditMode && formType !== 'transfer' && (
                <button 
                    type="button" 
                    onClick={handleSaveAsTemplate} 
                    disabled={!isTemplateFormValid} 
                    className="w-full flex items-center justify-center bg-zinc-700/70 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-200 font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                >
                    <span className="material-symbols-outlined mr-2" style={{fontSize: '20px'}}>bookmark_add</span>
                    Als Vorlage speichern
                </button>
              )}
              <button type="submit" disabled={!isFormValid} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500">
                  {isEditMode ? 'Änderungen speichern' : 'Speichern'}
              </button>
          </div>
      </form>
    </div>
  );
};

export default TransactionFormModal;