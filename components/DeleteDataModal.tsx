
import React, { useEffect } from 'react';

type DeleteScope = 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (scope: DeleteScope) => void;
}

const deleteOptions: { scope: DeleteScope; label: string; icon: string }[] = [
    { scope: 'all', label: 'Alles löschen', icon: 'delete_forever' },
    { scope: 'apps', label: 'Nur Apps löschen', icon: 'apps' },
    { scope: 'memo', label: 'Nur MemoMea löschen', icon: 'edit_note' },
    { scope: 'read', label: 'Nur ReadLateR löschen', icon: 'bookmark' },
    { scope: 'coll', label: 'Nur CollMea löschen', icon: 'collections_bookmark' },
    { scope: 'auri', label: 'Nur AuriMea löschen', icon: 'monitoring' },
];

const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ isOpen, onClose, onDelete }) => {
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
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
        <div className="flex justify-between items-center mb-4">
          <h2 id="delete-modal-title" className="text-xl font-bold text-red-400">
            Daten löschen
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 active:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            aria-label="Modal schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-zinc-400 mb-2">Wählen Sie aus, welche Daten Sie endgültig löschen möchten. <strong className="text-amber-400">Diese Aktion kann nicht rückgängig gemacht werden.</strong></p>
          {deleteOptions.map(option => (
            <button
              key={option.scope}
              onClick={() => onDelete(option.scope)}
              className="w-full flex items-center text-left p-4 bg-red-900/40 active:bg-red-900/60 rounded-lg transition-colors duration-200 text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900 focus:ring-red-500"
            >
              <span className="material-symbols-outlined mr-4 text-red-400">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeleteDataModal;
