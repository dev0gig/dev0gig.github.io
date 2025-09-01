import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useApp } from '../AuriMeaApp';
import { Transaction, TransactionTemplate } from '../types';
import Icon from './Icon';
import TemplatesModal from './TemplatesModal';

interface CategoryInputProps {
    value: string;
    onChange: (value: string) => void;
    allCategories: string[];
    error?: string;
}

const CategoryInput: React.FC<CategoryInputProps> = ({ value, onChange, allCategories, error }) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isListOpen, setIsListOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Sync inputValue with parent value
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value);
        }
    }, [value]);

    // Handle clicks outside to close the list
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex > -1 && listRef.current) {
            const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue); // Update parent form state immediately

        const filtered = allCategories.filter(cat => cat.toLowerCase().includes(newValue.toLowerCase()));
        setSuggestions(filtered);
        setIsListOpen(true);
        setActiveIndex(-1);
    };
    
    const handleFocus = () => {
        const filtered = allCategories.filter(cat => cat.toLowerCase().includes(inputValue.toLowerCase()));
        setSuggestions(filtered.length > 0 ? filtered : allCategories);
        setIsListOpen(true);
    };

    const handleSelect = (category: string) => {
        setInputValue(category);
        onChange(category);
        setIsListOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isListOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                break;
            case 'Enter':
                if (activeIndex > -1) {
                    e.preventDefault();
                    handleSelect(suggestions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsListOpen(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <label htmlFor="category-input" className="block text-sm font-medium text-zinc-300 mb-1">Kategorie</label>
            <input
                id="category-input"
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder="z.B. Lebensmittel"
                autoComplete="off"
                className={`w-full bg-zinc-700/50 border rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${error ? 'border-red-500/50' : 'border-zinc-600'}`}
            />
            {error && <p className="text-red-400 text-sm mt-1 animate-fadeInDown">{error}</p>}
            {isListOpen && suggestions.length > 0 && (
                <ul ref={listRef} className="absolute z-50 w-full bg-zinc-800 border border-zinc-600 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto top-full">
                    {suggestions.map((cat, index) => (
                        <li
                            key={cat}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(cat);
                            }}
                            className={`w-full text-left px-4 py-2 text-zinc-200 cursor-pointer ${index === activeIndex ? 'bg-violet-500/20' : 'hover:bg-violet-500/10'}`}
                        >
                            {cat}
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
  isMobileView?: boolean;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, transactionToEdit, isMobileView }) => {
  const { accounts, activeAccountId, categories, addTransaction, updateTransaction, deleteTransaction, addTemplate, showNotification, hideNotification } = useApp();
  const [formType, setFormType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [fromAccountId, setFromAccountId] = useState(activeAccountId);
  const [toAccountId, setToAccountId] = useState('');
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isTemplatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
        setErrors({}); // Clear errors when modal opens
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
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Der Betrag muss größer als 0 sein.';
    }
    if (!date) {
      newErrors.date = 'Bitte geben Sie ein Datum an.';
    }

    if (formType === 'transfer') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        newErrors.transfer = 'Bitte wählen Sie zwei unterschiedliche Konten aus.';
      }
    } else {
      if (!description.trim()) {
        newErrors.description = 'Bitte geben Sie eine Beschreibung ein.';
      }
      if (!category.trim()) {
        newErrors.category = 'Bitte wählen Sie eine Kategorie aus.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        return;
    }
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
  
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.defaultPrevented) {
      // Allow Shift+Enter for newlines in textarea
      if (e.target instanceof HTMLTextAreaElement && e.shiftKey) {
        return;
      }
      e.preventDefault();
      // Manually trigger submit event to run validation and submit
      formRef.current?.requestSubmit();
    }
  };

  const handleSaveAsTemplate = () => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (formType === 'transfer' || !description.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !category.trim()) {
          showNotification({
              title: 'Unvollständige Daten',
              message: 'Um eine Vorlage zu speichern, müssen Beschreibung, Betrag (>0) und Kategorie ausgefüllt sein. Überweisungen können nicht als Vorlage gespeichert werden.',
              type: 'warning',
              primaryButtonText: 'OK',
              onPrimaryButtonClick: hideNotification,
          });
          return;
      }
      addTemplate({ type: formType, description, amount: parsedAmount, category });
      showNotification({ title: 'Gespeichert', message: 'Die Transaktion wurde als Vorlage gespeichert.', type: 'success' });
  };

  const handleSelectTemplate = (template: TransactionTemplate) => {
      setFormType(template.type);
      setDescription(template.description);
      setAmount(template.amount.toString().replace('.', ','));
      setCategory(template.category);
      setTemplatesModalOpen(false);
  };

  const handleDelete = () => {
      if (transactionToEdit) {
          onClose();
          deleteTransaction(transactionToEdit.id);
      }
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode ? 'Transaktion bearbeiten' : 'Neue Transaktion';

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes fadeInDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
            .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
            .animate-fadeInDown { animation: fadeInDown 0.2s ease-out; }
        `}</style>
        <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn h-[90vh] max-h-[700px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold">{modalTitle}</h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center -m-1"><Icon name="close" /></button>
            </div>
            
            <form onSubmit={handleSubmit} noValidate ref={formRef} onKeyDown={handleFormKeyDown} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto -mr-3 pl-1 pr-3 space-y-4 py-1">
                    <div className="grid grid-cols-3 bg-zinc-800 rounded-lg p-1 gap-1">
                        <button type="button" onClick={() => setFormType('expense')} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'expense' ? 'bg-red-500/50 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Ausgabe</button>
                        <button type="button" onClick={() => setFormType('income')} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'income' ? 'bg-green-500/50 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Einnahme</button>
                        <button type="button" onClick={() => setFormType('transfer')} className={`py-2 text-sm font-bold rounded-md transition-colors ${formType === 'transfer' ? 'bg-blue-500/50 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Überweisung</button>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Datum</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={`w-full bg-zinc-700/50 border rounded-lg py-2 px-3 text-white ${errors.date ? 'border-red-500/50' : 'border-zinc-600'}`} />
                            {errors.date && <p className="text-red-400 text-sm mt-1 animate-fadeInDown">{errors.date}</p>}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-1">Betrag</label>
                            <input type="text" inputMode="decimal" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0,00" className={`w-full bg-zinc-700/50 border rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.amount ? 'border-red-500/50' : 'border-zinc-600'}`} />
                             {errors.amount && <p className="text-red-400 text-sm mt-1 animate-fadeInDown">{errors.amount}</p>}
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
                             {errors.transfer && <p className="text-red-400 text-sm mt-1 animate-fadeInDown">{errors.transfer}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Beschreibung</label>
                                <textarea ref={descriptionTextareaRef} id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="z.B. Wocheneinkauf" rows={1} className={`w-full bg-zinc-700/50 border rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none overflow-hidden ${errors.description ? 'border-red-500/50' : 'border-zinc-600'}`} />
                                {errors.description && <p className="text-red-400 text-sm mt-1 animate-fadeInDown">{errors.description}</p>}
                            </div>
                            <CategoryInput
                                value={category}
                                onChange={setCategory}
                                allCategories={categories[formType]}
                                error={errors.category}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-auto flex-shrink-0 space-y-3">
                    <button type="button" onClick={() => setTemplatesModalOpen(true)} className="w-full bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-200 font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                        <Icon name="file_present" className="mr-2" />
                        Aus Vorlage laden
                    </button>
                    <div className="flex items-center gap-3">
                        {isEditMode && formType !== 'transfer' && (
                            <button type="button" onClick={handleDelete} className="bg-red-900/40 hover:bg-red-900/60 text-red-300 font-bold p-3 rounded-lg" aria-label="Löschen">
                                <Icon name="delete" />
                            </button>
                        )}
                        <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg whitespace-nowrap">
                            {isEditMode ? 'Änderungen speichern' : 'Hinzufügen'}
                        </button>
                         {formType !== 'transfer' && (
                            <button type="button" onClick={handleSaveAsTemplate} title="Als Vorlage speichern" className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold p-3 rounded-lg" aria-label="Als Vorlage speichern">
                                <Icon name="bookmark_add" />
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
        <TemplatesModal 
            isOpen={isTemplatesModalOpen}
            onClose={() => setTemplatesModalOpen(false)}
            onSelect={handleSelectTemplate}
            isMobileView={isMobileView}
        />
    </div>
  );
};
export default TransactionFormModal;
