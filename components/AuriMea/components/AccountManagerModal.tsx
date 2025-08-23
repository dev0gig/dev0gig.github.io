import React, { useState } from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';
import { Account } from '../types';
import AccountFormModal from './AccountFormModal';

interface AccountManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ isOpen, onClose }) => {
    const { accounts, deleteAccount } = useApp();
    const [isFormOpen, setFormOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

    const handleAddNew = () => {
        setAccountToEdit(null);
        setFormOpen(true);
    };

    const handleEdit = (account: Account) => {
        setAccountToEdit(account);
        setFormOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
                <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-md m-4 p-6 animate-scaleIn h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold">Konten verwalten</h2>
                        <button onClick={onClose} className="p-1 -m-1"><Icon name="close" /></button>
                    </div>

                    <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2 py-1">
                        {accounts.map(account => (
                            <div key={account.id} className="group flex items-center bg-zinc-800/70 p-3 rounded-lg">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${account.color} mr-4`}>
                                    <Icon name={account.icon} className="text-white !text-lg" />
                                </div>
                                <span className="flex-grow font-medium truncate">{account.name}</span>
                                <div className="flex items-center space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(account)} className="p-2 rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-white"><Icon name="edit" className="!text-lg" /></button>
                                    <button onClick={() => deleteAccount(account.id)} className="p-2 rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-red-400"><Icon name="delete" className="!text-lg" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 mt-2 flex-shrink-0">
                        <button onClick={handleAddNew} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg">
                            Neues Konto hinzufügen
                        </button>
                    </div>
                </div>
            </div>
            <AccountFormModal
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                accountToEdit={accountToEdit}
            />
        </>
    );
};

export default AccountManagerModal;