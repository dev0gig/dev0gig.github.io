import React, { useEffect, useRef } from 'react';

interface BackupModalProps {
  mode: 'export' | 'import';
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onExportMemoMea: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ mode, onClose, onExport, onImport, onExportMemoMea }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const modalTitle = mode === 'export' ? 'Backup exportieren' : 'Backup importieren';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
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
          <h2 id="backup-modal-title" className="text-xl font-bold text-zinc-100">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
            aria-label="Modal schließen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {mode === 'export' && (
          <div className="space-y-4">
             <p className="text-sm text-zinc-400">Wählen Sie eine Exportmethode aus. Es wird empfohlen, regelmäßig vollständige Backups zu erstellen.</p>
             <div className="space-y-3 pt-2">
                <button
                    onClick={onExport}
                    className="w-full flex items-center text-left p-4 bg-zinc-700/50 hover:bg-zinc-700/80 rounded-lg transition-colors duration-200 text-zinc-200"
                >
                    <span className="material-symbols-outlined mr-4 text-zinc-300">database</span>
                    <div>
                        <span className="font-medium">Gesamtes Backup (.json)</span>
                        <p className="text-xs text-zinc-400">Sichert alle Anwendungsdaten (MemoMea, AuriMea, etc.) in einer Datei.</p>
                    </div>
                </button>
                 <button
                    onClick={onExportMemoMea}
                    className="w-full flex items-center text-left p-4 bg-zinc-700/50 hover:bg-zinc-700/80 rounded-lg transition-colors duration-200 text-zinc-200"
                >
                    <span className="material-symbols-outlined mr-4 text-zinc-300">folder_zip</span>
                     <div>
                        <span className="font-medium">MemoMea als Markdown (.zip)</span>
                        <p className="text-xs text-zinc-400">Exportiert alle MemoMea-Einträge als .md-Dateien, pro Tag zusammengefasst.</p>
                    </div>
                </button>
             </div>
          </div>
        )}

        {mode === 'import' && (
            <div>
                <p className="text-sm text-zinc-400 mb-4">Wählen Sie eine zuvor exportierte Backup-Datei (JSON oder ZIP für MemoMea) aus. <strong className="text-amber-400">Achtung:</strong> Das Importieren überschreibt vorhandene Daten für die entsprechenden Bereiche.</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/json,application/zip"
                    className="hidden"
                    aria-hidden="true"
                />
                <button
                    onClick={handleImportClick}
                    className="w-full flex items-center justify-center text-left p-4 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors duration-200 text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
                >
                    <span className="material-symbols-outlined mr-3">file_upload</span>
                    <span>Backup-Datei auswählen...</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default BackupModal;