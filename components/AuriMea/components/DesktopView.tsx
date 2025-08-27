
import React from 'react';
import { useApp } from '../AuriMeaApp';
import MainView from './MainView';
import Icon from './Icon';
import AnalysisSidebar from './AnalysisSidebar';

interface DesktopViewProps {
    onOpenForm: (transaction: any) => void;
    onOpenSettings: () => void;
}

const DesktopView: React.FC<DesktopViewProps> = ({ onOpenForm, onOpenSettings }) => {
    const { accounts, activeAccountId, setActiveAccountId } = useApp();

    const activeAccount = accounts.find(a => a.id === activeAccountId);
    if (!activeAccount) return null;

    return (
        <div className="flex h-full w-full">
            <nav className="w-72 flex-shrink-0 bg-zinc-900/50 p-4 flex flex-col border-r border-zinc-800">
                <div className="flex items-center justify-start mb-6 px-2">
                     <div className="flex items-center space-x-3">
                        <Icon name="payments" className="text-3xl text-violet-400" />
                        <h1 className="text-2xl font-bold">AuriMea</h1>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 py-1">
                    {accounts.map(account => (
                        <button
                            key={account.id}
                            onClick={() => setActiveAccountId(account.id)}
                            className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 ${
                                activeAccountId === account.id
                                    ? 'bg-violet-500/20 text-white font-semibold'
                                    : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-100'
                            }`}
                        >
                           <Icon name={account.icon} className="mr-4 text-2xl" />
                           <span className="flex-grow truncate">{account.name}</span>
                        </button>
                    ))}
                </div>
            </nav>
            <main className="flex-1 overflow-y-auto p-4">
                <MainView 
                    onOpenForm={onOpenForm}
                    onOpenSettings={onOpenSettings}
                />
            </main>
            <AnalysisSidebar />
        </div>
    );
};

export default DesktopView;