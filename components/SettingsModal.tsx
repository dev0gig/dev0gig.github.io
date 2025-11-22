import React from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    onToggleEditing: () => void;
    onImport: () => void;
    onExport: () => void;
    onShowCredits: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    isEditing,
    onToggleEditing,
    onImport,
    onExport,
    onShowCredits,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Einstellungen</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Edit Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-cyan-400">edit</span>
                            <span className="text-slate-200 font-medium">Bearbeitungsmodus</span>
                        </div>
                        <button
                            onClick={onToggleEditing}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isEditing ? 'bg-cyan-500' : 'bg-slate-600'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isEditing ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="h-px bg-white/10 my-4" />

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={onImport}
                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg text-slate-200 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-slate-400">upload</span>
                            <span>Konfiguration importieren</span>
                        </button>

                        <button
                            onClick={onExport}
                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg text-slate-200 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-slate-400">download</span>
                            <span>Konfiguration exportieren</span>
                        </button>

                        <button
                            onClick={onShowCredits}
                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg text-slate-200 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-slate-400">info</span>
                            <span>Credits anzeigen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
