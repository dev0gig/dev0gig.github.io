
import React, { useState, useEffect } from 'react';
import { Collection } from '../types';

interface CollectionFormModalProps {
  mode: 'add' | 'edit';
  collection?: Collection;
  onClose: () => void;
  onSave: (collectionData: { name: string; icon: string }, id?: string) => void;
}

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({ mode, collection, onClose, onSave }) => {
  const [name, setName] = useState('');
  // Icon selection is not implemented yet, so we use a default
  const [icon] = useState('list_alt'); 

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (isEditMode && collection) {
      setName(collection.name);
    } else {
      setName('');
    }
  }, [isEditMode, collection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSave({ name, icon }, isEditMode ? collection?.id : undefined);
    }
  };

  const isFormValid = name.trim().length > 0;
  const modalTitle = isEditMode ? 'Sammlung bearbeiten' : 'Neue Sammlung';
  const submitButtonText = isEditMode ? 'Änderungen speichern' : 'Erstellen';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-form-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
      <div
        className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="collection-form-modal-title" className="text-xl font-bold text-zinc-100">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 active:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            aria-label="Modal schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="collectionName" className="block text-sm font-medium text-zinc-300 mb-1">Name der Sammlung</label>
            <input 
              type="text" 
              id="collectionName" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="z.B. Einkaufsliste, Bücher..."
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" 
            />
          </div>
          {/* Future: Icon Picker could go here */}
          <div className="pt-2">
            <button type="submit" disabled={!isFormValid} className="w-full bg-violet-600 active:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500">
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionFormModal;