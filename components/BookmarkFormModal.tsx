
import React, { useState, useEffect } from 'react';

interface BookmarkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}

const BookmarkFormModal: React.FC<BookmarkFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onSave(url);
    }
  };

  const isUrlValid = () => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmark-form-modal-title"
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
          <h2 id="bookmark-form-modal-title" className="text-xl font-bold text-zinc-100">
            Neues Lesezeichen
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
            <label htmlFor="bookmarkUrl" className="block text-sm font-medium text-zinc-300 mb-1">Webseiten-URL</label>
            <input 
              type="url" 
              id="bookmarkUrl" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              required 
              placeholder="https://beispiel.de"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" 
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={!isUrlValid()} 
              className="w-full bg-violet-600 active:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500 flex items-center justify-center"
            >
              <span>Hinzufügen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookmarkFormModal;