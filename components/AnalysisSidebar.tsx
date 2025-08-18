

import React, { useMemo } from 'react';
import { Transaction, Account } from '../types';
import PieChart from './PieChart';

interface AnalysisSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  account: Account;
}

// --- Color Logic for Chart ---
// A predefined color palette for common expense categories to ensure consistency.
const categoryColors: { [key: string]: string } = {
  'Miete': '#3b82f6', // blue-500
  'Essen & Trinken': '#f97316', // orange-500
  'Lebensmittel': '#eab308', // yellow-500
  'Transport': '#22c55e', // green-500
  'Versicherung': '#64748b', // slate-500
  'Investments': '#14b8a6', // teal-500
  'Sparen': '#0ea5e9', // sky-500
  'Freizeit': '#a855f7', // purple-500
  'Reisen': '#ec4899', // pink-500
  'Kleidung': '#d946ef', // fuchsia-500
  'Gesundheit': '#ef4444', // red-500
  'Abonnements': '#8b5cf6', // violet-500
  'Bildung': '#6366f1', // indigo-500
  'Haushalt': '#f43f5e', // rose-500
  'Geschenke': '#fbbf24', // amber-400
  'Sonstiges': '#a1a1aa', // zinc-400
};

// A set of fallback colors for any new, user-defined categories.
const fallbackColors = [
  '#9333ea', '#c026d3', '#db2777', '#dc2626', '#ea580c', '#d97706',
  '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0d9488', '#0891b2',
  '#0284c7', '#2563eb', '#4f46e5', '#7c3aed'
];

const assignedFallbackColors: { [key: string]: string } = {};
let fallbackIndex = 0;

function getCategoryColor(category: string): string {
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  if (assignedFallbackColors[category]) {
    return assignedFallbackColors[category];
  }
  
  const color = fallbackColors[fallbackIndex % fallbackColors.length];
  fallbackIndex = (fallbackIndex + 1);
  assignedFallbackColors[category] = color;
  return color;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ isOpen, onClose, transactions, account }) => {
  
  const { chartData, chartColors, totalExpenses } = useMemo(() => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense' && t.category !== 'Transfer')
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a);

    const chartData = sortedCategories.map(([label, value]) => ({
      label,
      value,
    }));
    
    const chartColors = sortedCategories.map(([label]) => getCategoryColor(label));
    
    const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

    return { chartData, chartColors, totalExpenses };
  }, [transactions]);
  
  const formatCurrency = (value: number) => {
      return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-sidebar-title"
      className="fixed inset-0 z-50 flex flex-col bg-zinc-900 text-zinc-100 animate-slideIn"
    >
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
      `}</style>

      <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-700/60">
        <div>
          <h2 id="analysis-sidebar-title" className="text-xl font-bold text-zinc-100">
            Ausgabenanalyse
          </h2>
          <p className="text-sm text-zinc-400">{account.name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors rounded-full p-2 -m-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
          aria-label="Analyse schließen"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="text-center my-4">
          <p className="text-sm text-zinc-400 font-medium">Gesamtausgaben</p>
          <p className="text-3xl font-bold text-red-400 mt-1">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        
        <PieChart data={chartData} colors={chartColors} />
      </div>
    </div>
  );
};

export default AnalysisSidebar;
