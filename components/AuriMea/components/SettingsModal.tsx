

import React, { useState, useRef } from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onManageAccountsClick: () => void;
    onManageCategoriesClick: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onManageAccountsClick, onManageCategoriesClick }) => {
    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
             <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; } .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }`}</style>
            <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">AuriMea Einstellungen</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center -m-1"><Icon name="close" /></button>
                </div>
                <div className="space-y-3">
                    <button onClick={onManageAccountsClick} className="w-full flex items-center p-3 bg-zinc-700/50 rounded-lg text-zinc-200 hover:bg-zinc-700"><Icon name="account_balance_wallet" className="mr-3" /> Konten verwalten</button>
                    <button onClick={onManageCategoriesClick} className="w-full flex items-center p-3 bg-zinc-700/50 rounded-lg text-zinc-200 hover:bg-zinc-700"><Icon name="category" className="mr-3" /> Kategorien verwalten</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;