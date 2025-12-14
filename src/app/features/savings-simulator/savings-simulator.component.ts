import { Component, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';

@Component({
    selector: 'app-savings-simulator',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective, AppsLauncher],
    templateUrl: './savings-simulator.component.html',
})
export class SavingsSimulatorComponent {
    // --- Persistence Helper ---
    private load<T>(key: string, def: T): T {
        const stored = localStorage.getItem('savings-sim-' + key);
        return stored ? JSON.parse(stored) : def;
    }

    // --- Inputs (Signals) ---
    currentSavings = signal<number>(this.load('currentSavings', 10000));
    monthlyContribution = signal<number>(this.load('monthlyContribution', 900));
    cashAmount = signal<number>(this.load('cashAmount', 700));
    cashInterestRate = signal<number>(this.load('cashInterestRate', 2.0));
    etfAnnualReturn = signal<number>(this.load('etfAnnualReturn', 7.0));
    timeframeYears = signal<number>(this.load('timeframeYears', 2));
    calculationMode = signal<'duration' | 'target'>(this.load('calculationMode', 'duration'));
    targetAmount = signal<number>(this.load('targetAmount', 40000));

    constructor() {
        effect(() => {
            localStorage.setItem('savings-sim-currentSavings', JSON.stringify(this.currentSavings()));
            localStorage.setItem('savings-sim-monthlyContribution', JSON.stringify(this.monthlyContribution()));
            localStorage.setItem('savings-sim-cashAmount', JSON.stringify(this.cashAmount()));
            localStorage.setItem('savings-sim-cashInterestRate', JSON.stringify(this.cashInterestRate()));
            localStorage.setItem('savings-sim-etfAnnualReturn', JSON.stringify(this.etfAnnualReturn()));
            localStorage.setItem('savings-sim-timeframeYears', JSON.stringify(this.timeframeYears()));
            localStorage.setItem('savings-sim-calculationMode', JSON.stringify(this.calculationMode()));
            localStorage.setItem('savings-sim-targetAmount', JSON.stringify(this.targetAmount()));
        });
    }

    // --- Derived Calculations ---

    // Split calculation
    etfAmount = computed(() => Math.max(0, this.monthlyContribution() - this.cashAmount()));

    // Ratios for simulation
    cashAllocation = computed(() => {
        if (this.monthlyContribution() === 0) return 0;
        return Math.min(1, Math.max(0, this.cashAmount() / this.monthlyContribution()));
    });
    etfAllocation = computed(() => {
        if (this.monthlyContribution() === 0) return 0;
        return 1 - this.cashAllocation();
    });

    // Display Percentages
    cashPercentDisplay = computed(() => (this.cashAllocation() * 100).toFixed(0));
    etfPercentDisplay = computed(() => (this.etfAllocation() * 100).toFixed(0));

    // Simulation Logic
    simulationResults = computed(() => {
        const mode = this.calculationMode();
        // Limit calculation to 100 years to prevent infinite loops/performance issues
        const maxYearLimit = 100;

        let months = mode === 'duration' ? this.timeframeYears() * 12 : maxYearLimit * 12;
        const monthlyContrib = this.monthlyContribution();
        const target = this.targetAmount();

        // Initial Split
        let cashBalance = this.currentSavings() * this.cashAllocation();
        let etfBalance = this.currentSavings() * this.etfAllocation();
        let totalInvestedETF = etfBalance; // Track cost basis for ETF tax

        // Rates
        const monthlyCashRate = (this.cashInterestRate() / 100) / 12;
        const monthlyEtfRate = Math.pow(1 + (this.etfAnnualReturn() / 100), 1 / 12) - 1;

        const labels: string[] = [];
        const netWorthData: number[] = [];
        const investedData: number[] = [];

        // Loop
        for (let m = 1; m <= months; m++) {
            // Contributions
            const cashContrib = monthlyContrib * this.cashAllocation();
            const etfContrib = monthlyContrib * this.etfAllocation();

            // 1. Cash Calculation (Monthly Tax)
            // Interest gained this month
            const interest = cashBalance * monthlyCashRate;
            // Tax deduction (25% KESt) immediately
            const netInterest = interest * 0.75;
            cashBalance += cashContrib + netInterest;

            // 2. ETF Calculation (Deferred Tax)
            // Growth this month
            const growth = etfBalance * monthlyEtfRate;
            etfBalance += etfContrib + growth;
            totalInvestedETF += etfContrib;

            // Calculate Net ETF Value (Simulate selling now)
            const etfGains = etfBalance - totalInvestedETF;
            const taxOnGains = Math.max(0, etfGains * 0.275);
            const netEtfBalance = etfBalance - taxOnGains;

            // Total Net Wealth
            const totalNetWorth = cashBalance + netEtfBalance;

            // Record Data Points (e.g., every year for chart cleanliness)
            if (m % 12 === 0) {
                labels.push(`Jahr ${m / 12}`);
                netWorthData.push(totalNetWorth);
                investedData.push(this.currentSavings() + (monthlyContrib * m));
            }

            // In Target Mode, check if we reached goal
            if (mode === 'target' && totalNetWorth >= target) {
                // If we hit target mid-year, we should technically stop. 
                // But since we only record yearly for chart (above), let's finish the year or break?
                // Breaking immediately means chart might miss the final point if not month 12.
                // Let's break if we are past the recording point.
                if (m % 12 === 0) break;
            }
        }

        return {
            finalNetWorth: netWorthData[netWorthData.length - 1] || (this.currentSavings()),
            totalInvested: investedData[investedData.length - 1] || this.currentSavings(),
            chartLabels: labels,
            chartData: netWorthData,
            investedData: investedData
        };
    });

    // --- Key Metrics ---
    totalNetWealth = computed(() => this.simulationResults().finalNetWorth);

    // Years to Goal (Simple linear projection check)
    yearsToGoal = computed(() => {
        const data = this.simulationResults().chartData;
        const target = this.targetAmount();
        if (this.currentSavings() >= target) return 0;

        const foundIndex = data.findIndex(v => v >= target);
        if (foundIndex !== -1) return "Ca. " + (foundIndex + 1);
        return "> " + this.timeframeYears();
    });


    // --- Chart Config ---
    public lineChartData = computed<ChartConfiguration<'line'>['data']>(() => ({
        labels: this.simulationResults().chartLabels,
        datasets: [
            {
                data: this.simulationResults().investedData,
                label: 'Investiertes Kapital',
                fill: true,
                tension: 0.4,
                borderColor: '#64748b', // slate-500
                backgroundColor: 'rgba(100, 116, 139, 0.1)',
                pointBackgroundColor: '#64748b',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#64748b'
            },
            {
                data: this.simulationResults().chartData,
                label: 'Gesamt inkl. Zinsen',
                fill: true,
                tension: 0.4,
                borderColor: '#a855f7', // dash-accent
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                pointBackgroundColor: '#a855f7',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#a855f7'
            }
        ]
    }));

    public lineChartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#1a1a1d', // dash-card
                titleColor: '#e4e4e7', // dash-text
                bodyColor: '#a1a1aa', // dash-text-dim
                borderColor: '#2d2d31', // dash-border
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, color: '#2d2d31' },
                ticks: { color: '#a1a1aa' } // dash-text-dim
            },
            y: {
                grid: { color: '#2d2d31' }, // dash-border
                ticks: {
                    color: '#a1a1aa', // dash-text-dim
                    callback: function (value, index, values) {
                        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(Number(value));
                    }
                }
            }
        }
    };
}

