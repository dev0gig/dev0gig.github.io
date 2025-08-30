import React, { useState, useEffect, useRef } from 'react';
import { Flashcard } from '../types';

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Flashcard) => void;
  cardToEdit: Flashcard | null;
}

const CardFormModal: React.FC<CardFormModalProps> = ({ isOpen, onClose, onSave, cardToEdit }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditMode = !!cardToEdit;

  useEffect(() => {
    if (isOpen) {
      setFront(isEditMode ? cardToEdit.front : '');
      setBack(isEditMode ? cardToEdit.back : '');
      // Focus the first input when the modal opens
      setTimeout(() => frontTextareaRef.current?.focus(), 100);
    }
  }, [isOpen, cardToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      onSave({ front: front.trim(), back: back.trim() });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-form-modal-title"
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
        className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-lg m-4 p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="card-form-modal-title" className="text-xl font-bold text-zinc-100">
            {isEditMode ? 'Karte bearbeiten' : 'Neue Karte erstellen'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            aria-label="Modal schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cardFront" className="block text-sm font-medium text-zinc-300 mb-1">Vorderseite</label>
            <textarea
              id="cardFront"
              ref={frontTextareaRef}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              rows={4}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
          </div>
          <div>
            <label htmlFor="cardBack" className="block text-sm font-medium text-zinc-300 mb-1">Rückseite</label>
            <textarea
              id="cardBack"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              rows={4}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={!front.trim() || !back.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            >
              {isEditMode ? 'Änderungen speichern' : 'Karte hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardFormModal;