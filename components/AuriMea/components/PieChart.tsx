import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface PieChartSlice {
  label: string;
  value: number;
}

interface PieChartProps {
  data: PieChartSlice[];
  colors: string[];
}

const PieChart: React.FC<PieChartProps> = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <p>Keine Ausgabendaten zum Anzeigen vorhanden.</p>
      </div>
    );
  }
  
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Ausgaben',
        data: data.map(d => d.value),
        backgroundColor: colors,
        borderColor: '#18181b', // zinc-900 bg for spacing effect
        borderWidth: 2,
        hoverOffset: 8
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#d4d4d8', // zinc-300
          font: {
              family: "'Ubuntu', sans-serif",
          },
          boxWidth: 12,
          padding: 25,
        },
      },
      tooltip: {
        backgroundColor: '#27272a', // zinc-800
        titleColor: '#fafafa', // zinc-50
        bodyColor: '#e4e4e7', // zinc-200
        borderColor: '#52525b', // zinc-600
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              const value = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              label += `${value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} (${percentage}%)`;
            }
            return label;
          },
          title: function(context: any) {
            return context[0].label;
          }
        },
      },
      title: {
        display: false,
      },
    },
    cutout: '40%', // Creates a doughnut chart
  };

  return (
    <div className="relative h-96 w-full">
      <Pie options={options} data={chartData} />
    </div>
  );
};

export default PieChart;
