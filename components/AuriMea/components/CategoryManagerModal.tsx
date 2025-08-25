import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';
import { TransactionType } from '../types';

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
    const { categories, addCategory, updateCategory, deleteCategory } = useApp();
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ name: string; value: string } | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingCategory) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [editingCategory]);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        addCategory(activeTab, newCategory);
        setNewCategory('');
    };

    const handleStartEdit = (name: string) => {
        setEditingCategory({ name, value: name });
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    const handleSaveEdit = () => {
        if (editingCategory && editingCategory.name !== editingCategory.value) {
            updateCategory(activeTab, editingCategory.name, editingCategory.value);
        }
        setEditingCategory(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveEdit();
        if (e.key === 'Escape') handleCancelEdit();
    };
    
    const currentCategories = categories[activeTab];

    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-md m-4 p-6 animate-scaleIn h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">Kategorien verwalten</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center -m-1"><Icon name="close" /></button>
                </div>
                
                <div className="grid grid-cols-2 bg-zinc-800 rounded-lg p-1 gap-1 mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('expense')} className={`py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'expense' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Ausgaben</button>
                    <button onClick={() => setActiveTab('income')} className={`py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'income' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>Einnahmen</button>
                </div>

                <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2 py-1">
                    {currentCategories.map(cat => (
                        <div key={cat} className="group flex items-center bg-zinc-800/70 p-3 rounded-lg h-12">
                            {editingCategory?.name === cat ? (
                                <>
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editingCategory.value}
                                        onChange={e => setEditingCategory({ ...editingCategory, value: e.target.value })}
                                        onBlur={handleSaveEdit}
                                        onKeyDown={handleEditKeyDown}
                                        className="flex-grow bg-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <button onClick={handleSaveEdit} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-green-400"><Icon name="check" className="!text-lg" /></button>
                                    <button onClick={handleCancelEdit} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-white"><Icon name="close" className="!text-lg" /></button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-grow font-medium truncate">{cat}</span>
                                    {cat !== 'Sonstiges' && (
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleStartEdit(cat)} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-white"><Icon name="edit" className="!text-lg" /></button>
                                            <button onClick={() => deleteCategory(activeTab, cat)} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-red-400"><Icon name="delete" className="!text-lg" /></button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddCategory} className="pt-4 mt-2 flex-shrink-0 flex items-center gap-2">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="Neue Kategorie hinzufügen..."
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button type="submit" disabled={!newCategory.trim()} className="bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 text-white font-bold p-3 rounded-lg">
                        <Icon name="add" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CategoryManagerModal;