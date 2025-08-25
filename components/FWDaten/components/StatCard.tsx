import React from 'react';
import Icon from './Icon';

interface StatCardProps {
    title: string;
    value: string;
    icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
    return (
        <div className="bg-zinc-800/50 p-4 rounded-lg flex items-center space-x-4">
            <div className="bg-zinc-700/50 p-3 rounded-lg">
                <Icon name={icon} className="text-2xl text-violet-400" />
            </div>
            <div>
                <p className="text-sm font-medium text-zinc-400">{title}</p>
                <p className="text-xl font-bold text-zinc-100">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
