import React, { useState, useEffect } from 'react';
import { useApp } from '../AuriMeaApp';
import { Account } from '../types';
import Icon from './Icon';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '../constants';

interface AccountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountToEdit: Account | null;
    isSetupMode?: boolean;
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, accountToEdit, isSetupMode = false }) => {
    const { addAccount, updateAccount } = useApp();
    const [name, setName] = useState('');
    const [color, setColor] = useState(ACCOUNT_COLORS[0]);
    const [icon, setIcon] = useState(ACCOUNT_ICONS[0]);

    const isEditMode = !!accountToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && accountToEdit) {
                setName(accountToEdit.name);
                setColor(accountToEdit.color);
                setIcon(accountToEdit.icon);
            } else {
                setName('');
                setColor(ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]);
                setIcon(ACCOUNT_ICONS[0]);
            }
        }
    }, [isOpen, accountToEdit, isEditMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            if (isEditMode && accountToEdit) {
                updateAccount({ id: accountToEdit.id, name: name.trim(), color, icon });
            } else {
                addAccount({ name: name.trim(), color, icon });
            }
            onClose();
        }
    };

    if (!isOpen) return null;

    const modalTitle = isSetupMode ? "Konto erstellen" : isEditMode ? 'Konto bearbeiten' : 'Neues Konto';

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
            `}</style>
            <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{modalTitle}</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 active:text-white transition-colors rounded-full p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
                        aria-label="Schließen"
                    >
                        <Icon name="close" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-zinc-300 mb-1">Name des Kontos</label>
                        <input type="text" id="accountName" value={name} onChange={e => setName(e.target.value)} required placeholder="z.B. Hauptkonto" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Farbe</label>
                        <div className="flex flex-wrap gap-2">
                            {ACCOUNT_COLORS.map(c => (
                                <button type="button" key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform duration-150 ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-zinc-800 ring-white' : 'hover:scale-110'}`} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Icon</label>
                         <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-2">
                            {ACCOUNT_ICONS.map(i => (
                                <button type="button" key={i} onClick={() => setIcon(i)} className={`flex items-center justify-center w-full aspect-square rounded-lg transition-colors ${icon === i ? 'bg-violet-500/30 text-white' : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'}`}>
                                    <Icon name={i} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={!name.trim()} className="w-full bg-violet-600 disabled:bg-zinc-600 text-white font-bold py-3 px-4 rounded-lg">
                            {isEditMode ? 'Änderungen speichern' : 'Konto erstellen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountFormModal;