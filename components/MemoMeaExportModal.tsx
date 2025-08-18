import React, { useState, useEffect } from 'react';

interface MemoMeaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: string, endDate: string) => void;
  entryCount: number;
}

const MemoMeaExportModal: React.FC<MemoMeaExportModalProps> = ({ isOpen, onClose, onExport, entryCount }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    if (startDate && endDate) {
      onExport(startDate, endDate);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memomea-export-modal-title"
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
          <h2 id="memomea-export-modal-title" className="text-xl font-bold text-zinc-100">
            MemoMea Export
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
          <p className="text-sm text-zinc-400">Wählen Sie einen Datumsbereich für den Markdown-Export aus.</p>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-300 mb-1">Startdatum</label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-300 mb-1">Enddatum</label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={!startDate || !endDate || entryCount === 0} className="w-full bg-violet-600 active:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500">
              {entryCount > 0 ? 'Exportieren' : 'Keine Einträge zum Exportieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemoMeaExportModal;