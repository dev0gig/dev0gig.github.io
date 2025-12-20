import { Component, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-immo-check',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './immo-check.component.html',
})
export class ImmoCheckComponent {
    // --- Persistence Helper ---
    private load<T>(key: string, def: T): T {
        const stored = localStorage.getItem('immo-check-' + key);
        return stored ? JSON.parse(stored) : def;
    }

    // --- Input Signals ---
    netIncome = signal<number>(this.load('netIncome', 4600));
    monthlyFixedCosts = signal<number>(this.load('monthlyFixedCosts', 2000));
    housePrice = signal<number>(this.load('housePrice', 350000));
    equity = signal<number>(this.load('equity', 80000));
    interestRate = signal<number>(this.load('interestRate', 3.5));
    repaymentRate = signal<number>(this.load('repaymentRate', 2.0));
    loanDuration = signal<number>(this.load('loanDuration', 25));

    // Track which field was last changed to prevent circular updates
    private lastChanged = signal<'repayment' | 'duration' | null>(null);

    constructor() {
        // Persist all values
        effect(() => {
            localStorage.setItem('immo-check-netIncome', JSON.stringify(this.netIncome()));
            localStorage.setItem('immo-check-monthlyFixedCosts', JSON.stringify(this.monthlyFixedCosts()));
            localStorage.setItem('immo-check-housePrice', JSON.stringify(this.housePrice()));
            localStorage.setItem('immo-check-equity', JSON.stringify(this.equity()));
            localStorage.setItem('immo-check-interestRate', JSON.stringify(this.interestRate()));
            localStorage.setItem('immo-check-repaymentRate', JSON.stringify(this.repaymentRate()));
            localStorage.setItem('immo-check-loanDuration', JSON.stringify(this.loanDuration()));
        });
    }

    // --- Import from Savings Simulator ---
    importFromSavingsSimulator() {
        // The savings simulator stores its simulation results
        // We need to recalculate based on stored inputs
        const currentSavings = JSON.parse(localStorage.getItem('savings-sim-currentSavings') || '0');
        const monthlyContrib = JSON.parse(localStorage.getItem('savings-sim-monthlyContribution') || '0');
        const timeframe = JSON.parse(localStorage.getItem('savings-sim-timeframeYears') || '2');
        const cashRate = JSON.parse(localStorage.getItem('savings-sim-cashInterestRate') || '2') / 100;
        const etfRate = JSON.parse(localStorage.getItem('savings-sim-etfAnnualReturn') || '7') / 100;
        const cashAmount = JSON.parse(localStorage.getItem('savings-sim-cashAmount') || '0');

        // Calculate allocation
        const cashAlloc = monthlyContrib > 0 ? Math.min(1, cashAmount / monthlyContrib) : 0;
        const etfAlloc = 1 - cashAlloc;

        // Simulate the savings
        let cashBalance = currentSavings * cashAlloc;
        let etfBalance = currentSavings * etfAlloc;
        let totalInvestedETF = etfBalance;

        const months = timeframe * 12;
        const monthlyCashRate = cashRate / 12;
        const monthlyEtfRate = Math.pow(1 + etfRate, 1 / 12) - 1;

        for (let m = 1; m <= months; m++) {
            const cashContrib = monthlyContrib * cashAlloc;
            const etfContrib = monthlyContrib * etfAlloc;

            const interest = cashBalance * monthlyCashRate;
            cashBalance += cashContrib + (interest * 0.75); // After KESt

            etfBalance += etfContrib + (etfBalance * monthlyEtfRate);
            totalInvestedETF += etfContrib;
        }

        // Calculate net ETF (after tax on gains)
        const etfGains = etfBalance - totalInvestedETF;
        const netEtf = etfBalance - Math.max(0, etfGains * 0.275);

        const totalWealth = Math.round(cashBalance + netEtf);
        this.equity.set(totalWealth);
    }

    // --- Derived Calculations ---

    // Additional costs (Kaufnebenkosten): 10% of house price
    additionalCosts = computed(() => this.housePrice() * 0.10);

    // Total need (Gesamtbedarf)
    totalNeed = computed(() => this.housePrice() + this.additionalCosts());

    // Loan amount (Darlehensbetrag)
    loanAmount = computed(() => Math.max(0, this.totalNeed() - this.equity()));

    // Monthly mortgage payment (Annuität)
    monthlyMortgage = computed(() => {
        const principal = this.loanAmount();
        const annualRate = this.interestRate() / 100;
        const repayment = this.repaymentRate() / 100;

        // Monthly payment = (Principal * (Interest Rate + Repayment Rate)) / 12
        const annualPayment = principal * (annualRate + repayment);
        return annualPayment / 12;
    });

    // Remaining budget after mortgage
    remainingBudget = computed(() => {
        return this.netIncome() - this.monthlyFixedCosts() - this.monthlyMortgage();
    });

    // Equity percentage
    equityPercentage = computed(() => {
        if (this.housePrice() === 0) return 0;
        return (this.equity() / this.housePrice()) * 100;
    });

    // Mortgage to income ratio
    mortgageToIncomeRatio = computed(() => {
        if (this.netIncome() === 0) return 100;
        return (this.monthlyMortgage() / this.netIncome()) * 100;
    });

    // Traffic light status
    trafficLightStatus = computed<'green' | 'yellow' | 'red'>(() => {
        const budget = this.remainingBudget();
        const equityPct = this.equityPercentage();
        const mortgageRatio = this.mortgageToIncomeRatio();

        // Red: Negative budget
        if (budget < 0) return 'red';

        // Green: All KIM criteria met
        if (equityPct >= 20 && mortgageRatio <= 40 && budget > 500) {
            return 'green';
        }

        // Yellow: Budget positive but criteria not fully met
        return 'yellow';
    });

    // Traffic light message
    trafficLightMessage = computed(() => {
        const status = this.trafficLightStatus();
        const budget = this.remainingBudget();
        const equityPct = this.equityPercentage();
        const mortgageRatio = this.mortgageToIncomeRatio();

        if (status === 'red') {
            return 'Kritisch: Monatliches Defizit!';
        }

        if (status === 'green') {
            return 'Perfekt: KIM-Kriterien erfüllt & Budget sicher.';
        }

        // Yellow status - explain specific reason
        if (equityPct < 20) {
            return `KIM-Warnung: Eigenkapital nur ${equityPct.toFixed(1).replace('.', ',')}% (min. 20%).`;
        }
        if (mortgageRatio > 40) {
            return `KIM-Warnung: Kreditrate ${mortgageRatio.toFixed(1).replace('.', ',')}% vom Einkommen (max. 40%).`;
        }
        if (budget <= 500) {
            return `KIM-Warnung: Restbudget nur ${this.formatCurrency(budget)} (min. 500 €).`;
        }

        return 'Bitte alle Felder prüfen.';
    });

    // Traffic light icon
    trafficLightIcon = computed(() => {
        const status = this.trafficLightStatus();
        switch (status) {
            case 'green': return 'check_circle';
            case 'yellow': return 'warning';
            case 'red': return 'block';
        }
    });

    // --- Two-way calculation methods ---

    // When duration changes, calculate repayment rate
    updateFromDuration(years: number) {
        if (this.lastChanged() === 'repayment') {
            this.lastChanged.set(null);
            return;
        }

        this.loanDuration.set(years);
        this.lastChanged.set('duration');

        // Calculate approximate repayment rate from duration
        // Formula: For full repayment, monthly rate stays constant
        // Simplified: repayment ≈ (100 / years) - interest (rough estimate)
        const interest = this.interestRate();

        // More accurate: use annuity formula to derive repayment
        // Total annual rate = 100 / years (roughly)
        // So repayment = (100/years) - interest
        // But clamped to reasonable values
        let repayment = Math.max(0.5, Math.min(10, (100 / years) - interest + interest * 0.5));

        // Round to 0.1
        repayment = Math.round(repayment * 10) / 10;

        this.repaymentRate.set(repayment);
    }

    // When repayment rate changes, calculate duration
    updateFromRepayment(rate: number) {
        if (this.lastChanged() === 'duration') {
            this.lastChanged.set(null);
            return;
        }

        this.repaymentRate.set(rate);
        this.lastChanged.set('repayment');

        // Calculate approximate duration from repayment rate
        const interest = this.interestRate();
        const totalRate = interest + rate;

        if (totalRate <= 0) {
            this.loanDuration.set(50);
            return;
        }

        // Rough approximation: years ≈ 100 / (rate + some interest factor)
        let years = Math.round(100 / (rate + interest * 0.3));
        years = Math.max(5, Math.min(40, years));

        this.loanDuration.set(years);
    }

    // --- Formatting helpers ---
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    formatPercent(value: number): string {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value) + ' %';
    }
}
