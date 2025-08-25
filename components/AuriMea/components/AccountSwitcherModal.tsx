import React from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';

interface AccountSwitcherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({ isOpen, onClose }) => {
    const { accounts, activeAccountId, setActiveAccountId } = useApp();

    const handleSelectAccount = (accountId: string) => {
        setActiveAccountId(accountId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-modalFadeIn" onClick={onClose}>
             <style>{`
                @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-modalFadeIn { animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .animate-modalSlideUp { animation: modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            `}</style>
            <div
                className="bg-zinc-900 w-full max-w-lg rounded-t-2xl shadow-lg flex flex-col max-h-[60dvh] animate-modalSlideUp"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-700/60">
                    <h2 className="text-xl font-bold">Konto wechseln</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors rounded-full w-8 h-8 flex items-center justify-center -m-2"><Icon name="close" /></button>
                </header>
                <div className="flex-grow overflow-y-auto p-2">
                    <ul className="space-y-1">
                        {accounts.map(account => (
                            <li key={account.id}>
                                <button
                                    onClick={() => handleSelectAccount(account.id)}
                                    className={`w-full flex items-center text-left p-3 rounded-lg transition-colors ${
                                        activeAccountId === account.id
                                            ? 'bg-violet-500/20'
                                            : 'hover:bg-zinc-800'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${account.color} mr-4 flex-shrink-0`}>
                                        <Icon name={account.icon} className="text-white !text-lg" />
                                    </div>
                                    <span className="flex-grow font-medium truncate text-zinc-200">{account.name}</span>
                                    {activeAccountId === account.id && (
                                        <Icon name="check_circle" className="text-violet-400 ml-4 flex-shrink-0" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AccountSwitcherModal;