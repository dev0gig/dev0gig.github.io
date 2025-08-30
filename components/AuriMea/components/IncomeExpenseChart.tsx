import React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface DailyData {
    day: string;
    income: number;
    expense: number;
}

interface IncomeExpenseChartProps {
    data: DailyData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 p-3 rounded-lg shadow-lg">
                <p className="font-bold text-zinc-200 mb-2">{`Tag ${label}`}</p>
                <p className="text-sm text-green-400">{`Einnahmen (kum.): ${formatCurrency(payload[0].value)}`}</p>
                <p className="text-sm text-red-400">{`Ausgaben (kum.): ${formatCurrency(payload[1].value)}`}</p>
            </div>
        );
    }
    return null;
};


const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
    if (!data || data.length === 0 || data.every(d => d.income === 0 && d.expense === 0)) {
        return (
             <div className="flex items-center justify-center h-64 text-zinc-500">
                <p>Keine Daten für diesen Monat vorhanden.</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="income" name="Einnahmen (kum.)" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Ausgaben (kum.)" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default IncomeExpenseChart;