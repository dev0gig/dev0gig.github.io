
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';
import { Account } from '../types';
import AccountFormModal from './AccountFormModal';

interface AccountManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMobileView: boolean;
}

const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ isOpen, onClose, isMobileView }) => {
    const { accounts, deleteAccount, reorderAccounts } = useApp();
    const [isFormOpen, setFormOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

    // State for drag & drop with preview
    const [draggedAccounts, setDraggedAccounts] = useState<Account[] | null>(null);
    const dragItemIndex = useRef<number | null>(null);

    // Reset dragged state if accounts from context change (e.g., added/deleted) while modal is open
    useEffect(() => {
        setDraggedAccounts(null);
    }, [accounts]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItemIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // For Firefox compatibility
        
        // Timeout to allow browser to create drag image before state update
        setTimeout(() => {
            setDraggedAccounts([...accounts]);
        }, 0);
    };

    const handleDragEnter = (index: number) => {
        if (draggedAccounts === null || dragItemIndex.current === null || dragItemIndex.current === index) {
            return;
        }

        const reordered = [...draggedAccounts];
        const [movedItem] = reordered.splice(dragItemIndex.current, 1);
        reordered.splice(index, 0, movedItem);

        dragItemIndex.current = index; // Update the index as it has moved
        setDraggedAccounts(reordered);
    };
    
    const handleDragEnd = () => {
        if (draggedAccounts) {
            reorderAccounts(draggedAccounts);
        }
        dragItemIndex.current = null;
        setDraggedAccounts(null);
    };

    const handleAddNew = () => {
        setAccountToEdit(null);
        setFormOpen(true);
    };

    const handleEdit = (account: Account) => {
        setAccountToEdit(account);
        setFormOpen(true);
    };

    if (!isOpen) return null;

    const listToRender = draggedAccounts ?? accounts;

    return (
        <>
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
                <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-md m-4 p-6 animate-scaleIn h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold">Konten verwalten</h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center -m-1"><Icon name="close" /></button>
                    </div>

                    <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2 py-1">
                        {listToRender.map((account, index) => {
                             const isDragging = draggedAccounts && dragItemIndex.current === index;
                             return (
                                <div 
                                    key={account.id} 
                                    className={`group flex items-center bg-zinc-800/70 p-2 rounded-lg transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <div className="cursor-move p-1 text-zinc-500 active:text-white" aria-label="Konto verschieben">
                                        <Icon name="drag_indicator" />
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${account.color} mx-2 flex-shrink-0`}>
                                        <Icon name={account.icon} className="text-white !text-lg" />
                                    </div>
                                    <span className="flex-grow font-medium truncate">{account.name}</span>
                                    <div className={`flex items-center space-x-1 transition-opacity ${isMobileView ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                                        <button onClick={() => handleEdit(account)} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-white"><Icon name="edit" className="!text-lg" /></button>
                                        <button onClick={() => deleteAccount(account.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-red-400"><Icon name="delete" className="!text-lg" /></button>
                                    </div>
                                </div>
                            )
                        })}
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
