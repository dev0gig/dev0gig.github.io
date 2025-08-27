

import React, { useState, useEffect } from 'react';
import { AppItem } from '../types';

interface AppFormModalProps {
  mode: 'add' | 'edit';
  app?: AppItem;
  onClose: () => void;
  onSave: (app: Omit<AppItem, 'id' | 'isFavorite'>, id?: string) => void;
}

const AppFormModal: React.FC<AppFormModalProps> = ({ mode, app, onClose, onSave }) => {
  const [ariaLabel, setAriaLabel] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (isEditMode && app) {
      setAriaLabel(app.ariaLabel);
      setTargetUrl(app.targetUrl);
      setIconUrl(app.iconUrl);
    } else {
      // Reset for 'add' mode or if app is missing in 'edit' mode
      setAriaLabel('');
      setTargetUrl('');
      setIconUrl('');
    }
  }, [isEditMode, app]);

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
    if (ariaLabel && targetUrl && iconUrl) {
      onSave({ ariaLabel, targetUrl, iconUrl }, isEditMode ? app?.id : undefined);
    }
  };

  const isFormValid = ariaLabel && targetUrl && iconUrl;
  const modalTitle = isEditMode ? 'App bearbeiten' : 'Neue App hinzufügen';
  const submitButtonText = isEditMode ? 'Änderungen speichern' : 'Hinzufügen';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-form-modal-title"
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
          <h2 id="app-form-modal-title" className="text-xl font-bold text-zinc-100">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
            <input type="text" id="appName" value={ariaLabel} onChange={(e) => setAriaLabel(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label htmlFor="appUrl" className="block text-sm font-medium text-zinc-300 mb-1">Ziel-URL</label>
            <input type="url" id="appUrl" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label htmlFor="iconUrl" className="block text-sm font-medium text-zinc-300 mb-1">Icon-URL</label>
            <input type="url" id="iconUrl" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={!isFormValid} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500">
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppFormModal;