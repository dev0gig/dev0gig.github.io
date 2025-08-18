


import React from 'react';

interface SettingsModalProps {
  onClose: () => void;
  onExportClick: () => void;
  onImportClick: () => void;
  onDeleteAllClick: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isDesktop: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onExportClick, onImportClick, onDeleteAllClick, isEditMode, onToggleEditMode, isDesktop }) => {
  // useEffect to handle Escape key press
  React.useEffect(() => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
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
          <h2 id="settings-modal-title" className="text-xl font-bold text-zinc-100">
            Einstellungen
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 active:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            aria-label="Einstellungen schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="space-y-3">
            {!isDesktop && (
              <>
                <button 
                    onClick={onToggleEditMode}
                    className={`w-full flex items-center text-left p-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 ${isEditMode ? 'bg-violet-600 active:bg-violet-700 text-white focus:ring-violet-500' : 'bg-zinc-700/50 active:bg-zinc-700/80 text-zinc-200 focus:ring-violet-500'}`}
                >
                    <span className="material-symbols-outlined mr-4">{isEditMode ? 'done' : 'grid_view'}</span>
                    <span className="font-medium">{isEditMode ? 'Bearbeitung beenden' : 'Layout bearbeiten'}</span>
                </button>
                <hr className="border-zinc-700/60" />
              </>
            )}

            <div className="p-3 bg-amber-900/40 border border-amber-500/30 rounded-lg text-sm text-amber-300 flex items-start space-x-3">
              <span className="material-symbols-outlined mt-0.5 text-amber-400" style={{ fontSize: '20px' }}>info</span>
              <p>
                Die folgenden Aktionen sind endgültig und gelten nur für Daten der internen Projekte und der App-Ansicht.
              </p>
            </div>
            <button 
                onClick={onExportClick}
                className="w-full flex items-center text-left p-4 bg-zinc-700/50 active:bg-zinc-700/80 rounded-lg transition-colors duration-200 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            >
                <span className="material-symbols-outlined mr-4 text-zinc-300">upload_file</span>
                <span className="font-medium">Backup exportieren</span>
            </button>
            <button 
                onClick={onImportClick}
                className="w-full flex items-center text-left p-4 bg-zinc-700/50 active:bg-zinc-700/80 rounded-lg transition-colors duration-200 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            >
                <span className="material-symbols-outlined mr-4 text-zinc-300">input</span>
                <span className="font-medium">Backup importieren</span>
            </button>
            <button 
                onClick={onDeleteAllClick}
                className="w-full flex items-center text-left p-4 bg-red-900/40 active:bg-red-900/60 rounded-lg transition-colors duration-200 text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900 focus:ring-red-500"
            >
                <span className="material-symbols-outlined mr-4 text-red-400">delete_forever</span>
                <span className="font-medium">Alles löschen</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;