
import React, { useState, useEffect } from 'react';
import type { Project } from '../types';

interface EditModalProps {
  isOpen: boolean;
  item: Project | null;
  itemType: 'project' | 'bookmark' | null;
  onSave: (item: Project) => void;
  onCancel: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, item, itemType, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Project, 'url'>>({ name: '', icon: '', isFavorite: false });
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({ name: item.name, icon: item.icon, isFavorite: item.isFavorite });
      setUrl(item.url);
    } else {
      setFormData({ name: '', icon: '', isFavorite: false });
      setUrl('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For new items, we use the URL as is. For existing ones, we keep the original URL as the ID.
    onSave({ ...formData, url: item?.url || url });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">{item ? 'Element bearbeiten' : 'Neues Element hinzufügen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1">URL</label>
              <input
                type="url"
                id="url"
                name="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                required
                disabled={!!item} // Disable editing URL for existing items, as it's the unique ID
              />
            </div>
            {itemType === 'project' && (
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-slate-300 mb-1">Icon Name</label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                  placeholder="z.B. 'home' oder 'settings'"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Name eines <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:underline">Google Material Symbols</a>.</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
