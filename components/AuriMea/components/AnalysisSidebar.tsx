import React, { useMemo } from 'react';
import { useApp } from '../AuriMeaApp';
import PieChart from './PieChart';
import { formatCurrency } from '../utils/formatters';
import IncomeExpenseChart from './IncomeExpenseChart';

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
  const { accounts, transactions, activeAccountId, currentDate } = useApp();
  const activeAccount = accounts.find(a => a.id === activeAccountId);
  
  const { chartData, chartColors, totalExpenses } = useMemo(() => {
    if (!activeAccount) return { chartData: [], chartColors: [], totalExpenses: 0 };

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const expensesByCategory = transactions
      .filter(t => {
          const txDate = new Date(t.createdAt);
          return t.accountId === activeAccountId &&
              t.type === 'expense' &&
              t.category !== 'Transfer' &&
              txDate.getMonth() === month &&
              txDate.getFullYear() === year;
      })
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);

    const data = sortedCategories.map(([label, value]) => ({ label, value }));
    const colors = sortedCategories.map(([label]) => getCategoryColor(label));
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return { chartData: data, chartColors: colors, totalExpenses: total };
  }, [transactions, activeAccountId, activeAccount, currentDate]);

  const dailyChartData = useMemo(() => {
    if (!activeAccount) return [];
    
    const SALARY_KEYWORDS = ['gehalt', 'lohn', 'salary'];
    const SALARY_CUTOFF_DAY = 25;

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // --- Function to get a month's total income and expense based on salary rules ---
    const getMonthTotals = (month: number, year: number) => {
        const monthBeforeDate = new Date(year, month, 0);
        const monthBefore = monthBeforeDate.getMonth();
        const yearBefore = monthBeforeDate.getFullYear();

        // Income for the month is regular income + late salaries from month before
        const totalIncome = transactions
            .filter(t => {
                if (t.type !== 'income' || t.accountId !== activeAccountId) return false;
                const txDate = new Date(t.createdAt);
                // Case 1: Regular income in the target month
                if (txDate.getMonth() === month && txDate.getFullYear() === year) {
                    const isSalary = SALARY_KEYWORDS.some(kw => t.description.toLowerCase().includes(kw));
                    return !(isSalary && txDate.getDate() >= SALARY_CUTOFF_DAY);
                }
                // Case 2: Late salary from the month before
                if (txDate.getMonth() === monthBefore && txDate.getFullYear() === yearBefore) {
                    const isSalary = SALARY_KEYWORDS.some(kw => t.description.toLowerCase().includes(kw));
                    return isSalary && txDate.getDate() >= SALARY_CUTOFF_DAY;
                }
                return false;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        // Expense is just expenses in the target month
        const totalExpense = transactions
            .filter(t => {
                if (t.type !== 'expense' || t.accountId !== activeAccountId) return false;
                const txDate = new Date(t.createdAt);
                return txDate.getMonth() === month && txDate.getFullYear() === year;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return { totalIncome, totalExpense };
    };

    // --- Calculate previous month's net balance ---
    const prevMonthDate = new Date(currentYear, currentMonth, 0);
    const { totalIncome: prevMonthIncome, totalExpense: prevMonthExpense } = getMonthTotals(prevMonthDate.getMonth(), prevMonthDate.getFullYear());
    const prevMonthNetBalance = prevMonthIncome - prevMonthExpense;

    // --- Process daily transactions for current month ---
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: (i + 1).toString().padStart(2, '0'),
        income: 0,
        expense: 0,
    }));

    // Get all income transactions that count towards the CURRENT month's period
    const currentMonthIncomeTransactions = transactions.filter(t => {
        if (t.type !== 'income' || t.accountId !== activeAccountId || t.category === 'Transfer') return false;
        const txDate = new Date(t.createdAt);
        // Case 1: Regular income in the current month
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            const isSalary = SALARY_KEYWORDS.some(kw => t.description.toLowerCase().includes(kw));
            return !(isSalary && txDate.getDate() >= SALARY_CUTOFF_DAY);
        }
        // Case 2: Late salary from previous month
        if (txDate.getMonth() === prevMonthDate.getMonth() && txDate.getFullYear() === prevMonthDate.getFullYear()) {
            const isSalary = SALARY_KEYWORDS.some(kw => t.description.toLowerCase().includes(kw));
            return isSalary && txDate.getDate() >= SALARY_CUTOFF_DAY;
        }
        return false;
    });

    // Distribute this income into daily buckets
    currentMonthIncomeTransactions.forEach(t => {
        const txDate = new Date(t.createdAt);
        // Late salaries are conceptually day 0, but for the chart, let's put them on day 1 (index 0).
        const dayOfMonth = (txDate.getMonth() === currentMonth) ? txDate.getDate() - 1 : 0;
        if (dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
            dailyData[dayOfMonth].income += t.amount;
        }
    });

    // Distribute expenses into daily buckets
    transactions
        .filter(t => {
            if (t.type !== 'expense' || t.accountId !== activeAccountId || t.category === 'Transfer') return false;
            const txDate = new Date(t.createdAt);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        })
        .forEach(t => {
            const dayOfMonth = new Date(t.createdAt).getDate() - 1;
            dailyData[dayOfMonth].expense += t.amount;
        });

    // --- Calculate Cumulative Values ---
    let cumulativeIncome = prevMonthNetBalance;
    let cumulativeExpense = 0;

    return dailyData.map(d => {
        cumulativeIncome += d.income;
        cumulativeExpense += d.expense;
        return {
            ...d,
            income: cumulativeIncome,
            expense: cumulativeExpense,
        };
    });
  }, [transactions, activeAccountId, activeAccount, currentDate]);
  
  if (!activeAccount) return null;

  return (
    <aside
      aria-labelledby="analysis-sidebar-title"
      className="w-96 flex-shrink-0 bg-zinc-800/50 border-l border-zinc-700/60 flex flex-col"
    >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-700/60">
            <div>
              <h2 id="analysis-sidebar-title" className="text-xl font-bold text-zinc-100">Ausgabenanalyse</h2>
              <p className="text-sm text-zinc-400">{activeAccount.name} &bull; {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
            </div>
          </header>

          <div className="flex-grow overflow-y-auto p-4 space-y-8">
            <div>
              <div className="text-center my-4">
                <p className="text-sm text-zinc-400 font-medium">Gesamtausgaben ({currentDate.toLocaleDateString('de-DE', { month: 'short' })})</p>
                <p className="text-3xl font-bold text-red-400 mt-1">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              
              <PieChart data={chartData} colors={chartColors} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2 text-center">Kumulativer Monatsverlauf</h3>
              <div className="h-72">
                  <IncomeExpenseChart data={dailyChartData} />
              </div>
            </div>
          </div>
    </aside>
  );
};

export default AnalysisSidebar;
