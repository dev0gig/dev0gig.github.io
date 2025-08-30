import React, { useMemo, useState } from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';
import { formatCurrency } from '../utils/formatters';
import { Transaction } from '../types';
import AccountSwitcherModal from './AccountSwitcherModal';

// --- Configuration for Salary Handling ---
// Keywords to identify salary transactions (case-insensitive).
const SALARY_KEYWORDS = ['gehalt', 'lohn', 'salary'];
// Salaries received on or after this day of the month count towards the next month's income summary.
const SALARY_CUTOFF_DAY = 25;


interface MainViewProps {
  onOpenForm: (transaction: Transaction | null) => void;
  onOpenSettings: () => void;
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


const MainView: React.FC<MainViewProps> = ({ onOpenForm, onOpenSettings, onBack }) => {
    const { accounts, transactions, activeAccountId, currentDate, setCurrentDate } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAccountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
    const activeAccount = accounts.find(a => a.id === activeAccountId);

    const { balance } = useMemo(() => {
        if (!activeAccount) return { balance: 0 };
        const txns = transactions.filter(t => t.accountId === activeAccountId);
        const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { balance: income - expense };
    }, [transactions, activeAccountId, activeAccount]);
    
    const { monthlyTransactions, monthlyIncome, monthlyExpense } = useMemo(() => {
        if (!activeAccount) return { monthlyTransactions: [], monthlyIncome: 0, monthlyExpense: 0 };

        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // The list of transactions to display should be for the selected month.
        const txnsForCurrentMonth = transactions
            .filter(t => {
                const txDate = new Date(t.createdAt);
                return t.accountId === activeAccountId && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            })
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Expense calculation is straightforward.
        const expense = txnsForCurrentMonth
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // --- Adjusted Income Calculation ---
        let adjustedIncome = 0;

        // 1. Get income from the current month, EXCLUDING late salaries
        const incomeFromCurrentMonth = txnsForCurrentMonth
            .filter(t => {
                if (t.type !== 'income') return false;
                const txDate = new Date(t.createdAt);
                const isSalary = SALARY_KEYWORDS.some(kw => t.description.toLowerCase().includes(kw));
                // Exclude if it's a salary payment on or after the cutoff day
                return !(isSalary && txDate.getDate() >= SALARY_CUTOFF_DAY);
            });
        adjustedIncome += incomeFromCurrentMonth.reduce((sum, t) => sum + t.amount, 0);

        // 2. Get late salaries from the PREVIOUS month
        const prevMonthDate = new Date(currentYear, currentMonth, 1);
        prevMonthDate.setDate(0); // Sets it to the last day of the previous month
        const prevMonth = prevMonthDate.getMonth();
        const prevMonthYear = prevMonthDate.getFullYear();

        const lateSalariesFromPrevMonth = transactions
            .filter(t => {
                if (t.type !== 'income' || t.accountId !== activeAccountId) return false;
                
                const txDate = new Date(t.createdAt);
                if (txDate.getMonth() !== prevMonth || txDate.getFullYear() !== prevMonthYear) return false;
                
                const isSalary = SALARY_KEYWORDS.some(kw => t.description.toLowerCase().includes(kw));
                // Include if it's a salary payment on or after the cutoff day
                return isSalary && txDate.getDate() >= SALARY_CUTOFF_DAY;
            });
        adjustedIncome += lateSalariesFromPrevMonth.reduce((sum, t) => sum + t.amount, 0);

        return {
            monthlyTransactions: txnsForCurrentMonth,
            monthlyIncome: adjustedIncome,
            monthlyExpense: expense
        };
    }, [transactions, activeAccountId, activeAccount, currentDate]);
    
    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return monthlyTransactions;
        const lowercasedQuery = searchQuery.toLowerCase();
        return monthlyTransactions.filter(t =>
            t.description.toLowerCase().includes(lowercasedQuery) ||
            t.category.toLowerCase().includes(lowercasedQuery) ||
            t.amount.toString().includes(lowercasedQuery)
        );
    }, [searchQuery, monthlyTransactions]);

    if (!activeAccount) {
        return <div className="p-4 text-center text-zinc-500">Kein Konto ausgewählt.</div>;
    }
    
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15));
    const handleGoToToday = () => setCurrentDate(new Date());

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
                        <button onClick={onBack} className="mr-1 p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 md:hidden" aria-label="Zurück">
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
            
            <div className="flex-shrink-0 px-4 md:px-0 md:pt-4">
                 <div className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-lg mt-4 md:mt-0">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors" aria-label="Vorheriger Monat"><Icon name="chevron_left" /></button>
                    <div className="text-center">
                         <span className="font-bold text-lg">{currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span>
                         <button onClick={handleGoToToday} className="ml-2 text-xs font-semibold text-zinc-300 bg-zinc-700/50 hover:bg-zinc-700/80 px-2 py-1 rounded-md transition-colors">Heute</button>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors" aria-label="Nächster Monat"><Icon name="chevron_right" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                        <p className="text-sm text-zinc-400">Einnahmen (Monat)</p>
                        <p className="font-bold text-lg text-green-400">{formatCurrency(monthlyIncome)}</p>
                    </div>
                    <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                        <p className="text-sm text-zinc-400">Ausgaben (Monat)</p>
                        <p className="font-bold text-lg text-red-400">{formatCurrency(monthlyExpense)}</p>
                    </div>
                </div>
            </div>

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
                        <p className="text-sm">{searchQuery ? `Keine Ergebnisse für "${searchQuery}"` : `Keine Transaktionen in diesem Monat.`}</p>
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