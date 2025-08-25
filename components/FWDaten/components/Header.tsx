

import React from 'react';
import Icon from './Icon';

interface HeaderProps {
    onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
    return (
        <header className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-zinc-800">
             <div className="flex items-center space-x-2 flex-grow">
                <button onClick={onBack} className="mr-1 p-2 -ml-2 rounded-full active:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 lg:hidden" aria-label="Zurück">
                    <Icon name="arrow_back" />
                </button>
                <Icon name="ssid_chart" className="text-3xl text-violet-400" />
                <h1 className="text-2xl font-bold tracking-tight">FW-Daten</h1>
            </div>
        </header>
    );
};

export default Header;