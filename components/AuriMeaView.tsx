

import React from 'react';
import { Transaction, Account } from '../types';

interface AuriMeaViewProps {
  transactions: Transaction[];
  onContextMenu: (event: React.MouseEvent, transaction: Transaction) => void;
  searchQuery: string;
  accounts: Account[];
  activeAccountId: string;
  onAccountChange: (accountId: string) => void;
  onOpenAnalysis: () => void;
}

const TransactionRow: React.FC<{ transaction: Transaction; onContextMenu: (event: React.MouseEvent, transaction: Transaction) => void; }> = ({ transaction, onContextMenu }) => {
    const isIncome = transaction.type === 'income';
    const isTransfer = !!transaction.transferId;
    const amountPrefix = isIncome ? '+' : '-';
    
    const { icon, iconBG, iconColor, amountColor } = (() => {
        if (isTransfer) {
            return {
                icon: 'sync_alt',
                iconBG: 'bg-blue-500/20',
                iconColor: 'text-blue-400',
                amountColor: 'text-zinc-400'
            };
        }
        if (isIncome) {
            return {
                icon: 'arrow_upward',
                iconBG: 'bg-green-500/20',
                iconColor: 'text-green-400',
                amountColor: 'text-green-400',
            };
        }
        // Expense
        return {
            icon: 'arrow_downward',
            iconBG: 'bg-red-500/20',
            iconColor: 'text-red-400',
            amountColor: 'text-red-400',
        };
    })();

    const formattedDate = new Date(transaction.createdAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
    });
    
    const formattedAmount = transaction.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <li 
            onContextMenu={(e) => onContextMenu(e, transaction)}
            className="group flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg transition-colors hover:bg-zinc-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label={`Transaktion ${transaction.description}. Rechtsklick für Optionen.`}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-center space-x-4 overflow-hidden">
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${iconBG}`}>
                   <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{icon}</span>
                </div>
                <div className="overflow-hidden">
                    <p className="font-medium text-zinc-200 truncate">{transaction.description}</p>
                    <p className="text-sm text-zinc-400">{transaction.category} &bull; {formattedDate}</p>
                </div>
            </div>
            <div className="flex items-center flex-shrink-0 ml-2">
                <p className={`font-bold text-base md:text-lg ${amountColor} mr-1`}>{`${amountPrefix} ${formattedAmount} €`}</p>
                 <div className="w-8 h-8 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '20px' }}>
                        more_vert
                    </span>
                 </div>
            </div>
        </li>
    );
};

const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Heute';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Gestern';
    }
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
};


const AuriMeaView: React.FC<AuriMeaViewProps> = ({ transactions, onContextMenu, searchQuery, accounts, activeAccountId, onAccountChange, onOpenAnalysis }) => {
  const activeAccount = accounts.find(a => a.id === activeAccountId) ?? accounts[0];
  
  const accountTransactions = transactions.filter(t => t.accountId === activeAccountId);
  
  const lowercasedQuery = searchQuery.toLowerCase();
  
  const filteredTransactions = searchQuery
    ? accountTransactions.filter(t =>
        t.description.toLowerCase().includes(lowercasedQuery) ||
        t.category.toLowerCase().includes(lowercasedQuery) ||
        t.amount.toString().includes(lowercasedQuery)
      )
    : accountTransactions;

  const totalIncome = accountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  const formatCurrency = (value: number) => {
      return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };
  
  const transactionElements = filteredTransactions.reduce<React.ReactNode[]>((acc, transaction, index) => {
    const currentDateStr = new Date(transaction.createdAt).toDateString();
    const prevDateStr = index > 0 ? new Date(filteredTransactions[index - 1].createdAt).toDateString() : null;

    if (currentDateStr !== prevDateStr) {
        acc.push(
            <li key={`header-${currentDateStr}`} className="pt-4 pb-1">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{formatDateHeader(transaction.createdAt)}</h3>
            </li>
        );
    }

    acc.push(
        <TransactionRow 
            key={transaction.id} 
            transaction={transaction} 
            onContextMenu={onContextMenu}
        />
    );

    return acc;
  }, []);


  return (
    <div className="animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      
      <header className="flex items-center justify-between text-zinc-300 mb-6">
         <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-4xl">monitoring</span>
            <h1 className="text-3xl font-bold tracking-tight">AuriMea</h1>
         </div>
         <button
            onClick={onOpenAnalysis}
            className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
            aria-label="Ausgabenanalyse anzeigen"
            title="Ausgabenanalyse anzeigen"
        >
            <span className="material-symbols-outlined text-xl">pie_chart</span>
        </button>
      </header>
      
      {/* Account Switcher */}
      <div className="flex items-center space-x-1 sm:space-x-2 bg-zinc-900/50 p-1 rounded-lg mb-6">
        {accounts.map(account => (
            <button
                key={account.id}
                onClick={() => onAccountChange(account.id)}
                className={`w-full text-center px-2 py-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${account.ringColor} ${
                    activeAccountId === account.id
                        ? `${account.color} text-white shadow`
                        : 'text-zinc-300 hover:bg-zinc-700/50'
                }`}
                aria-pressed={activeAccountId === account.id}
            >
                {account.name}
            </button>
        ))}
      </div>


      {/* Summary Card */}
       <div className={`bg-zinc-800/70 backdrop-blur-xl border rounded-2xl p-5 shadow-md w-full mb-8 transition-colors ${activeAccount.borderColor}`}>
            <div className="flex justify-around items-center text-center">
                <div>
                    <p className="text-sm text-zinc-400 font-medium mb-1">Einnahmen</p>
                    <p className="text-xl font-bold text-green-400">
                        {formatCurrency(totalIncome)}
                    </p>
                </div>
                <div className="border-l border-zinc-700 h-12"></div>
                <div>
                    <p className="text-sm text-zinc-400 font-medium mb-1">Saldo</p>
                    <p className={`text-2xl font-bold ${balance < 0 ? 'text-red-400' : balance > 0 ? activeAccount.accentColor : 'text-white'}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
                <div className="border-l border-zinc-700 h-12"></div>
                <div>
                    <p className="text-sm text-zinc-400 font-medium mb-1">Ausgaben</p>
                    <p className="text-xl font-bold text-red-400">
                        {formatCurrency(totalExpense)}
                    </p>
                </div>
            </div>
        </div>
      
      {/* Transaction List */}
      <div>
          <h2 className="text-lg font-bold text-zinc-300 mb-4">Letzte Transaktionen</h2>
          {filteredTransactions.length > 0 ? (
            <ul className="space-y-3">
                {transactionElements}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-zinc-500 bg-zinc-800/30 rounded-lg py-16">
                {searchQuery ? (
                     <>
                        <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">search_off</span>
                        <h2 className="text-2xl font-bold text-zinc-400">Nichts gefunden</h2>
                        <p className="mt-1 text-zinc-500">Für "{searchQuery}" gibt es keine Treffer.</p>
                     </>
                ) : (
                     <>
                        <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">receipt_long</span>
                        <h2 className="text-2xl font-bold text-zinc-400">Keine Transaktionen</h2>
                        <p className="mt-1 text-zinc-500">Für dieses Konto gibt es keine Einträge.</p>
                    </>
                )}
            </div>
          )}
      </div>
    </div>
  );
};

export default AuriMeaView;