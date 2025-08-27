


import React, { useEffect, useRef } from 'react';

type ExportScope = 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri' | 'memomd' | 'fwdaten';

interface BackupModalProps {
  mode: 'export' | 'import';
  scope: ExportScope | null;
  onClose: () => void;
  onExport: (scope: ExportScope) => void;
  onImport: (file: File) => void;
}

const scopeDetailsMap: Record<ExportScope, { label: string; icon: string }> = {
    all: { label: 'Alle Daten', icon: 'database' },
    apps: { label: 'Apps', icon: 'apps' },
    memo: { label: 'MemoMea (JSON)', icon: 'edit_note' },
    memomd: { label: 'MemoMea (Markdown)', icon: 'markdown' },
    read: { label: 'ReadLateR', icon: 'bookmark' },
    coll: { label: 'CollMea', icon: 'collections_bookmark' },
    auri: { label: 'AuriMea', icon: 'payments' },
    fwdaten: { label: 'FW-Daten', icon: 'ssid_chart' },
};

const BackupModal: React.FC<BackupModalProps> = ({ mode, scope, onClose, onExport, onImport }) => {
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
  
  const details = scope ? scopeDetailsMap[scope] : null;
  const modalTitle = mode === 'export' 
    ? (scope ? `${details?.label} exportieren` : 'Backup exportieren') 
    : 'Backup importieren';
  
  const renderExportSelection = () => (
    <div className="space-y-3">
        <p className="text-sm text-zinc-400">Wählen Sie aus, welche Daten Sie als Datei exportieren möchten.</p>
        {(Object.keys(scopeDetailsMap) as ExportScope[]).map(key => (
             <button
                key={key}
                onClick={() => onExport(key)}
                className="w-full flex items-center text-left p-4 bg-zinc-700/50 hover:bg-zinc-700/80 rounded-lg transition-colors duration-200 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
              >
                <span className="material-symbols-outlined mr-4 text-zinc-300">{scopeDetailsMap[key].icon}</span>
                <span className="font-medium">{scopeDetailsMap[key].label}</span>
              </button>
        ))}
    </div>
  );


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
        
        {mode === 'export' && !scope && renderExportSelection()}
        
        {mode === 'export' && details && scope && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Ihre {details.label}-Daten werden als Datei exportiert.</p>
              <button
                onClick={() => onExport(scope)}
                className="w-full flex items-center justify-center text-left p-4 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors duration-200 text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
              >
                <span className="material-symbols-outlined mr-3">{details.icon}</span>
                <span>{`Backup für ${details.label} erstellen`}</span>
              </button>
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