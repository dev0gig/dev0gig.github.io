import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Reading } from '../types';

interface ReadingsChartProps {
    readings: Reading[];
}

const ReadingsChart: React.FC<ReadingsChartProps> = ({ readings }) => {
    if (readings.length < 2) {
        return <div className="flex h-full items-center justify-center text-zinc-500">Nicht genügend Daten für ein Diagramm.</div>;
    }

    const data = readings.map(r => ({
        date: new Date(r.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        value: r.value,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#e4e4e7' }}
                    formatter={(value: number) => [value.toLocaleString('de-DE'), 'Zählerstand']}
                />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ReadingsChart;
