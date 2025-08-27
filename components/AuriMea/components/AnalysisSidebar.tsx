import React, { useMemo } from 'react';
import { useApp } from '../AuriMeaApp';
import PieChart from './PieChart';
import { formatCurrency } from '../utils/formatters';

// --- Color Logic for Chart ---
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

const fallbackColors = [
  '#9333ea', '#c026d3', '#db2777', '#dc2626', '#ea580c', '#d97706',
  '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0d9488', '#0891b2',
  '#0284c7', '#2563eb', '#4f46e5', '#7c3aed'
];

const assignedFallbackColors: { [key: string]: string } = {};
let fallbackIndex = 0;

function getCategoryColor(category: string): string {
  if (categoryColors[category]) return categoryColors[category];
  if (assignedFallbackColors[category]) return assignedFallbackColors[category];
  
  const color = fallbackColors[fallbackIndex % fallbackColors.length];
  fallbackIndex = (fallbackIndex + 1);
  assignedFallbackColors[category] = color;
  return color;
}

const AnalysisSidebar: React.FC = () => {
  const { accounts, transactions, activeAccountId } = useApp();
  const activeAccount = accounts.find(a => a.id === activeAccountId);
  
  const { chartData, chartColors, totalExpenses } = useMemo(() => {
    if (!activeAccount) return { chartData: [], chartColors: [], totalExpenses: 0 };

    const expensesByCategory = transactions
      .filter(t => t.accountId === activeAccountId && t.type === 'expense' && t.category !== 'Transfer')
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);

    const data = sortedCategories.map(([label, value]) => ({ label, value }));
    const colors = sortedCategories.map(([label]) => getCategoryColor(label));
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return { chartData: data, chartColors: colors, totalExpenses: total };
  }, [transactions, activeAccountId, activeAccount]);
  
  if (!activeAccount) return null;

  return (
    <aside
      aria-labelledby="analysis-sidebar-title"
      className="w-96 flex-shrink-0 bg-zinc-800/50 border-l border-zinc-700/60 flex flex-col"
    >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-700/60">
            <div>
              <h2 id="analysis-sidebar-title" className="text-xl font-bold text-zinc-100">Ausgabenanalyse</h2>
              <p className="text-sm text-zinc-400">{activeAccount.name}</p>
            </div>
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
    </aside>
  );
};

export default AnalysisSidebar;