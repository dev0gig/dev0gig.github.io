
import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import MainView from './components/MainView';
import DesktopView from './components/DesktopView';
import TransactionFormModal from './components/TransactionFormModal';
import SettingsModal from './components/SettingsModal';
import NotificationModal, { NotificationType } from './components/NotificationModal';
import AccountFormModal from './components/AccountFormModal';
import Icon from './components/Icon';
import { INITIAL_ACCOUNTS } from './constants';
import type { Account, Transaction, TransactionTemplate, TransactionType, Categories } from './types';
import AccountManagerModal from './components/AccountManagerModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import { useAuriMeaData } from '../../hooks/useAuriMeaData';

// Notification State Type
interface NotificationState {
    isOpen: boolean;
    title: string;
    message: string;
    type?: NotificationType;
    primaryButtonText?: string;
    onPrimaryButtonClick?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;
}

// App Context for state management
interface AppContextType {
    accounts: Account[];
    transactions: Transaction[];
    templates: TransactionTemplate[];
    categories: Categories;
    activeAccountId: string;
    setActiveAccountId: (id: string) => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>, transferPeer?: Omit<Transaction, 'id'>) => void;
    updateTransaction: (transaction: Transaction) => void;
    deleteTransaction: (transactionId: string) => void;
    addTemplate: (template: Omit<TransactionTemplate, 'id'>) => void;
    deleteTemplate: (templateId: string) => void;
    addCategory: (type: "income" | "expense", category: string) => void;
    updateCategory: (type: "income" | "expense", oldName: string, newName: string) => void;
    deleteCategory: (type: "income" | "expense", name: string) => void;
    addAccount: (accountData: Omit<Account, 'id'>) => void;
    updateAccount: (account: Account) => void;
    deleteAccount: (accountId: string) => void;
    showNotification: (config: Omit<NotificationState, 'isOpen'>) => void;
    hideNotification: () => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

const AppContext = createContext<AppContextType | null>(null);
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

interface AuriMeaAppProps {
    isMobileView: boolean;
    onBack?: () => void;
}

// Main App Component
export default function AuriMeaApp({ isMobileView, onBack }: AuriMeaAppProps) {
    const {
        accounts, setAccounts,
        transactions, setTransactions,
        templates, setTemplates,
        categories, setCategories,
        activeAccountId, setActiveAccountId,
        isInitialSetup,
        isDataLoaded
    } = useAuriMeaData();

    const [isFormOpen, setFormOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [notification, setNotification] = useState<NotificationState>({ isOpen: false, title: '', message: '' });
    const [isAccountManagerOpen, setAccountManagerOpen] = useState(false);
    const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
    const [isAccountModalOpenForSetup, setAccountModalOpenForSetup] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const isDesktop = !isMobileView;

    // Notification Handlers
    const hideNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showNotification = useCallback((config: Omit<NotificationState, 'isOpen'>) => {
        setNotification({ ...config, isOpen: true });
    }, []);

    // Handlers
    const handleOpenForm = (transaction: Transaction | null = null) => {
        setEditingTransaction(transaction);
        setFormOpen(true);
    };

    const addTransaction = useCallback((transactionData: Omit<Transaction, 'id'>, transferPeer?: Omit<Transaction, 'id'>) => {
        setTransactions(prev => {
            const newTransaction = { ...transactionData, id: `txn-${Date.now()}` };
            if (transferPeer) {
                const newPeer = { ...transferPeer, id: `txn-${Date.now() + 1}`, transferId: newTransaction.id };
                newTransaction.transferId = newPeer.id;
                return [newTransaction, newPeer, ...prev];
            }
            return [newTransaction, ...prev];
        });
    }, [setTransactions]);

    const updateTransaction = useCallback((updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    }, [setTransactions]);

    const deleteTransaction = useCallback((transactionId: string) => {
        const transactionToDelete = transactions.find(t => t.id === transactionId);
        if (!transactionToDelete) return;

        const performDelete = (ids: string[]) => {
            setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
        };

        if (transactionToDelete.transferId) {
            showNotification({
                title: 'Überweisung löschen',
                message: 'Dies ist eine Überweisung. Möchten Sie beide zugehörigen Buchungen (Einnahme und Ausgabe) löschen oder nur die ausgewählte?',
                type: 'warning',
                primaryButtonText: 'Beide löschen',
                onPrimaryButtonClick: () => {
                    performDelete([transactionId, transactionToDelete.transferId!]);
                    hideNotification();
                },
                secondaryButtonText: 'Nur diese löschen',
                onSecondaryButtonClick: () => {
                    performDelete([transactionId]);
                    hideNotification();
                }
            });
        } else {
            showNotification({
                title: 'Transaktion löschen',
                message: `Möchten Sie die Transaktion "${transactionToDelete.description}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                type: 'danger',
                primaryButtonText: 'Löschen',
                onPrimaryButtonClick: () => {
                    performDelete([transactionId]);
                    hideNotification();
                },
                secondaryButtonText: 'Abbrechen',
                onSecondaryButtonClick: hideNotification
            });
        }
    }, [transactions, showNotification, hideNotification, setTransactions]);
    
    const addTemplate = useCallback((templateData: Omit<TransactionTemplate, 'id'>) => {
        setTemplates(prev => [{...templateData, id: `tpl-${Date.now()}`}, ...prev]);
    }, [setTemplates]);

    const deleteTemplate = useCallback((templateId: string) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    }, [setTemplates]);
    
    const addCategory = useCallback((type: "income" | "expense", category: string) => {
        if (!category.trim()) return;
        setCategories(prev => {
            if (prev[type].some(c => c.toLowerCase() === category.toLowerCase())) {
                showNotification({ title: 'Kategorie existiert bereits', message: `Die Kategorie "${category}" ist bereits vorhanden.`, type: 'warning', primaryButtonText: 'OK', onPrimaryButtonClick: hideNotification });
                return prev;
            }
            return { ...prev, [type]: [...prev[type], category.trim()].sort() };
        });
    }, [showNotification, hideNotification, setCategories]);

     const updateCategory = useCallback((type: "income" | "expense", oldName: string, newName: string) => {
        if (!newName.trim() || newName.toLowerCase() === oldName.toLowerCase()) return;

        if (categories[type].some(c => c.toLowerCase() === newName.toLowerCase())) {
            showNotification({ title: 'Kategorie existiert bereits', message: `Die Kategorie "${newName}" ist bereits vorhanden.`, type: 'warning', primaryButtonText: 'OK', onPrimaryButtonClick: hideNotification });
            return;
        }

        setCategories(prev => ({
            ...prev,
            [type]: prev[type].map(c => c === oldName ? newName.trim() : c).sort()
        }));

        setTransactions(prev => prev.map(t => {
            if (t.category === oldName) {
                return { ...t, category: newName.trim() };
            }
            return t;
        }));
    }, [categories, showNotification, hideNotification, setCategories, setTransactions]);

    const deleteCategory = useCallback((type: "income" | "expense", categoryToDelete: string) => {
        showNotification({
            title: 'Kategorie löschen',
            message: `Möchten Sie die Kategorie "${categoryToDelete}" wirklich löschen? Alle zugehörigen Transaktionen werden der Kategorie "Sonstiges" zugewiesen.`,
            type: 'warning',
            primaryButtonText: 'Löschen',
            onPrimaryButtonClick: () => {
                const fallbackCategory = 'Sonstiges';
                
                // Re-assign transactions
                setTransactions(prev => prev.map(t => {
                    if (t.category === categoryToDelete) {
                        return { ...t, category: fallbackCategory };
                    }
                    return t;
                }));

                // Remove category
                setCategories(prev => ({
                    ...prev,
                    [type]: prev[type].filter(c => c !== categoryToDelete)
                }));
                
                hideNotification();
            },
            secondaryButtonText: 'Abbrechen',
            onSecondaryButtonClick: hideNotification
        });
    }, [showNotification, hideNotification, setTransactions, setCategories]);

    const addAccount = useCallback((accountData: Omit<Account, 'id'>) => {
        const newAccount = { ...accountData, id: `acc-${Date.now()}` };
        setAccounts(prev => [newAccount, ...prev]);
        setActiveAccountId(newAccount.id); // Switch to new account
    }, [setAccounts, setActiveAccountId]);

    const updateAccount = useCallback((updatedAccount: Account) => {
        setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    }, [setAccounts]);
    
    const deleteAccount = useCallback((accountId: string) => {
        if (accounts.length <= 1) {
            showNotification({ title: 'Aktion nicht möglich', message: 'Das letzte verbleiende Konto kann nicht gelöscht werden.', type: 'warning', primaryButtonText: 'OK', onPrimaryButtonClick: hideNotification });
            return;
        }
        
        const accountToDelete = accounts.find(a => a.id === accountId);
        showNotification({
            title: 'Konto löschen',
            message: `Möchten Sie das Konto "${accountToDelete?.name}" und ALLE zugehörigen Transaktionen wirklich unwiderruflich löschen?`,
            type: 'danger',
            primaryButtonText: 'Ja, alles löschen',
            onPrimaryButtonClick: () => {
                // If deleting active account, switch to another one
                if (activeAccountId === accountId) {
                    const newActiveAccount = accounts.find(a => a.id !== accountId);
                    if (newActiveAccount) setActiveAccountId(newActiveAccount.id);
                }
                setAccounts(prev => prev.filter(a => a.id !== accountId));
                setTransactions(prev => prev.filter(t => t.accountId !== accountId));
                hideNotification();
            },
            secondaryButtonText: 'Abbrechen',
            onSecondaryButtonClick: hideNotification
        });
    }, [accounts, activeAccountId, showNotification, hideNotification, setAccounts, setTransactions, setActiveAccountId]);

    const contextValue: AppContextType = useMemo(() => ({
        accounts,
        transactions,
        templates,
        categories,
        activeAccountId,
        setActiveAccountId,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addTemplate,
        deleteTemplate,
        addCategory,
        updateCategory,
        deleteCategory,
        addAccount,
        updateAccount,
        deleteAccount,
        showNotification,
        hideNotification,
        currentDate,
        setCurrentDate,
    }), [accounts, transactions, templates, categories, activeAccountId, addTransaction, updateTransaction, deleteTransaction, addTemplate, deleteTemplate, addCategory, updateCategory, deleteCategory, addAccount, updateAccount, deleteAccount, showNotification, hideNotification, currentDate]);

    if (!isDataLoaded) {
        return <div className="h-full w-full bg-zinc-900 flex items-center justify-center text-zinc-400">Loading...</div>;
    }
    
    if (isInitialSetup) {
        return (
            <AppContext.Provider value={contextValue}>
                 <div className="h-full w-full bg-zinc-900 flex flex-col">
                    {!isDesktop && onBack && (
                         <header className="flex items-center p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
                            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        </header>
                    )}
                     <div className="flex-grow flex flex-col items-center justify-center text-zinc-400 p-8 text-center animate-fadeIn">
                        <style>{`
                            @keyframes fadeIn {
                              from { opacity: 0; transform: translateY(10px); }
                              to { opacity: 1; transform: translateY(0); }
                            }
                            .animate-fadeIn {
                              animation: fadeIn 0.5s ease-out forwards;
                            }
                        `}</style>
                        <Icon name="payments" className="!text-6xl mb-4 text-zinc-600" />
                        <h2 className="text-2xl font-bold text-zinc-400">Willkommen bei AuriMea</h2>
                        <p className="mt-1 text-zinc-500 mb-6 max-w-sm">Erstelle dein erstes Konto, um deine Einnahmen und Ausgaben zu verfolgen und deine Finanzen zu verwalten.</p>
                        <button
                            onClick={() => setAccountModalOpenForSetup(true)}
                            className="flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                        >
                            <Icon name="add_circle" className="mr-2"/>
                            <span>Erstes Konto erstellen</span>
                        </button>
                    </div>
                    {isAccountModalOpenForSetup && (
                        <AccountFormModal
                            isOpen={true}
                            onClose={() => setAccountModalOpenForSetup(false)}
                            accountToEdit={null}
                            isSetupMode={true}
                        />
                    )}
                </div>
            </AppContext.Provider>
        );
    }

    return (
        <AppContext.Provider value={contextValue}>
            <div className="h-full w-full bg-zinc-900 text-zinc-200 flex flex-col overflow-hidden">
                 {isDesktop ? (
                    <DesktopView
                        onOpenForm={handleOpenForm}
                        onOpenSettings={() => setSettingsOpen(true)}
                    />
                ) : (
                    <MainView 
                        onOpenForm={handleOpenForm}
                        onOpenSettings={() => setSettingsOpen(true)}
                        onBack={onBack}
                    />
                )}

                <TransactionFormModal 
                    isOpen={isFormOpen}
                    onClose={() => setFormOpen(false)}
                    transactionToEdit={editingTransaction}
                />
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onManageAccountsClick={() => setAccountManagerOpen(true)}
                    onManageCategoriesClick={() => setCategoryManagerOpen(true)}
                />
                <AccountManagerModal 
                    isOpen={isAccountManagerOpen}
                    onClose={() => setAccountManagerOpen(false)}
                    isMobileView={isMobileView}
                />
                 <CategoryManagerModal
                    isOpen={isCategoryManagerOpen}
                    onClose={() => setCategoryManagerOpen(false)}
                    isMobileView={isMobileView}
                />
                <NotificationModal
                    isOpen={notification.isOpen}
                    onClose={hideNotification}
                    title={notification.title}
                    message={notification.message}
                    type={notification.type}
                    primaryButtonText={notification.primaryButtonText}
                    onPrimaryButtonClick={notification.onPrimaryButtonClick}
                    secondaryButtonText={notification.secondaryButtonText}
                    onSecondaryButtonClick={notification.onSecondaryButtonClick}
                />
            </div>
        </AppContext.Provider>
    );
}
