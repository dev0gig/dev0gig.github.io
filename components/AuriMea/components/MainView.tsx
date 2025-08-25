import React, { useMemo, useState } from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';
import { formatCurrency } from '../utils/formatters';
import { Transaction } from '../types';
import AccountSwitcherModal from './AccountSwitcherModal';

interface MainViewProps {
  onOpenForm: (transaction: Transaction | null) => void;
  onOpenSettings: () => void;
  onOpenAnalysis?: () => void;
  onBack?: () => void;
}

const TransactionRow: React.FC<{ transaction: Transaction; onClick: (t: Transaction) => void }> = ({ transaction, onClick }) => {
    const isIncome = transaction.type === 'income';
    const amountPrefix = isIncome ? '+' : '-';
    
    const { icon, iconBG, iconColor, amountColor } = (() => {
        if (transaction.transferId) {
            return { icon: 'swap_horiz', iconBG: 'bg-blue-500/10', iconColor: 'text-blue-400', amountColor: 'text-zinc-400' };
        }
        if (isIncome) {
            return { icon: 'arrow_upward', iconBG: 'bg-green-500/10', iconColor: 'text-green-400', amountColor: 'text-green-400' };
        }
        return { icon: 'arrow_downward', iconBG: 'bg-red-500/10', iconColor: 'text-red-400', amountColor: 'text-red-400' };
    })();

    const formattedDate = new Date(transaction.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });

    return (
        <li 
            onClick={() => onClick(transaction)}
            className="group flex items-center justify-between p-3 rounded-lg transition-colors bg-zinc-800/50 hover:bg-zinc-800/70 cursor-pointer"
        >
            <div className="flex items-center space-x-4 overflow-hidden">
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${iconBG}`}>
                   <Icon name={icon} className={`text-2xl ${iconColor}`} />
                </div>
                <div className="overflow-hidden">
                    <p className="font-medium text-zinc-200 truncate">{transaction.description}</p>
                    <p className="text-sm text-zinc-400">{transaction.category} &bull; {formattedDate}</p>
                </div>
            </div>
            <div className="flex items-center flex-shrink-0 ml-2">
                <p className={`font-semibold text-base ${amountColor}`}>{`${amountPrefix} ${formatCurrency(transaction.amount)}`}</p>
            </div>
        </li>
    );
};


const MainView: React.FC<MainViewProps> = ({ onOpenForm, onOpenSettings, onOpenAnalysis, onBack }) => {
    const { accounts, transactions, activeAccountId } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAccountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
    const activeAccount = accounts.find(a => a.id === activeAccountId);

    const { accountTransactions, balance } = useMemo(() => {
        if (!activeAccount) return { accountTransactions: [], balance: 0, totalIncome: 0, totalExpense: 0 };
        const txns = transactions
            .filter(t => t.accountId === activeAccountId)
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        return { accountTransactions: txns, balance: income - expense };
    }, [transactions, activeAccountId, activeAccount]);
    
    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return accountTransactions;
        const lowercasedQuery = searchQuery.toLowerCase();
        return accountTransactions.filter(t =>
            t.description.toLowerCase().includes(lowercasedQuery) ||
            t.category.toLowerCase().includes(lowercasedQuery) ||
            t.amount.toString().includes(lowercasedQuery)
        );
    }, [searchQuery, accountTransactions]);

    if (!activeAccount) {
        return <div className="p-4 text-center text-zinc-500">Kein Konto ausgewählt.</div>;
    }

    const transactionGroups = filteredTransactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
        const dateKey = new Date(tx.createdAt).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(tx);
        return acc;
    }, {});

    const formatDateHeader = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
    
        if (date.toDateString() === today.toDateString()) return 'Heute';
        if (date.toDateString() === yesterday.toDateString()) return 'Gestern';
        return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
    };

    const canSwitchAccounts = accounts.length > 1;

    return (
        <div className="h-full flex flex-col">
            <header className="flex items-center justify-between p-4 md:p-0 md:pb-6 md:border-b md:border-zinc-800 flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    {onBack && (
                        <button onClick={onBack} className="mr-1 p-2 -ml-2 rounded-full active:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 md:hidden" aria-label="Zurück">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <button
                        className="flex items-center space-x-3 text-left disabled:cursor-default group md:pointer-events-none"
                        onClick={() => canSwitchAccounts && setAccountSwitcherOpen(true)}
                        disabled={!canSwitchAccounts}
                        aria-label="Konto wechseln"
                    >
                        <div className={`p-3 rounded-lg ${activeAccount.color}`}>
                            <Icon name={activeAccount.icon} className="text-white !text-3xl" />
                        </div>
                        <div className="overflow-hidden">
                            <div className="flex items-center space-x-1.5">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{activeAccount.name}</h1>
                                {canSwitchAccounts && <Icon name="unfold_more" className="text-zinc-500 md:hidden" />}
                            </div>
                            <p className={`font-bold text-lg md:text-xl ${balance >= 0 ? 'text-zinc-300' : 'text-red-400'}`}>
                                {formatCurrency(balance)}
                            </p>
                        </div>
                    </button>
                </div>
                
                <div className="flex items-center space-x-2">
                    {/* Mobile Buttons */}
                    <div className="flex items-center space-x-2 md:hidden">
                        <button onClick={onOpenSettings} className="text-zinc-400 hover:text-white transition-colors rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500" aria-label="Einstellungen">
                            <Icon name="settings" />
                        </button>
                        <button onClick={() => onOpenForm(null)} className="flex items-center justify-center w-12 h-12 bg-violet-600 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500">
                            <Icon name="add" className="!text-3xl" />
                        </button>
                    </div>
                    
                    {/* Desktop Buttons */}
                    <div className="hidden md:flex items-center space-x-3">
                        {onOpenAnalysis && (
                            <button onClick={onOpenAnalysis} className="flex items-center font-medium py-2.5 px-4 rounded-lg transition-colors bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap">
                                <Icon name="bar_chart" className="mr-2 text-lg"/>
                                <span>Analyse</span>
                            </button>
                        )}
                        <button onClick={() => onOpenForm(null)} className="flex items-center font-bold py-2.5 px-4 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap">
                            <Icon name="add_circle" className="mr-2 text-lg"/>
                            <span>Neue Transaktion</span>
                        </button>
                        <div className="border-l border-zinc-700/60 h-6" aria-hidden="true"></div>
                        <button onClick={onOpenSettings} className="text-zinc-400 hover:text-white transition-colors rounded-full w-11 h-11 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500" aria-label="Einstellungen">
                            <Icon name="settings" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-0 md:mt-6 flex-shrink-0">
                 <div className="relative mb-4 md:mb-0">
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Transaktionen durchsuchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto px-4 md:px-0 md:pt-6">
                {filteredTransactions.length > 0 ? (
                    <ul className="space-y-2">
                        {Object.entries(transactionGroups).map(([date, txs]) => (
                            <li key={date}>
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider my-3 px-2">
                                    {formatDateHeader(date)}
                                </h3>
                                <ul className="space-y-1">
                                    {txs.map(tx => <TransactionRow key={tx.id} transaction={tx} onClick={onOpenForm} />)}
                                </ul>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-16 text-zinc-500">
                        <Icon name={searchQuery ? 'search_off' : 'receipt_long'} className="!text-6xl mb-4" />
                        <h3 className="font-bold text-lg text-zinc-400">{searchQuery ? 'Nichts gefunden' : 'Keine Transaktionen'}</h3>
                        <p className="text-sm">{searchQuery ? `Keine Ergebnisse für "${searchQuery}"` : 'Fügen Sie Ihre erste Transaktion hinzu.'}</p>
                    </div>
                )}
            </div>
            <AccountSwitcherModal 
                isOpen={isAccountSwitcherOpen}
                onClose={() => setAccountSwitcherOpen(false)}
            />
        </div>
    );
};

export default MainView;