import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarService } from '../sidebar.service';
import { JournalService } from '../../features/journal/journal';

interface WeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    location: string;
}

interface ForecastDay {
    date: Date;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
}

// Budget data interfaces (matching budget-page.ts)
interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category: string;
    account: string;
    toAccount?: string;
    date: string;
}

interface Account {
    id: string;
    name: string;
    balance: number;
}

@Component({
    selector: 'app-right-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './right-sidebar.component.html',
    styleUrl: './right-sidebar.component.css'
})
export class RightSidebarComponent implements OnInit, OnDestroy {
    sidebarService = inject(SidebarService);
    journalService = inject(JournalService);

    // Budget data signals
    budgetTransactions = signal<Transaction[]>([]);
    budgetAccounts = signal<Account[]>([]);

    // Clock signals
    currentTime = signal('');
    currentDate = signal('');
    currentDay = signal('');
    currentWeek = signal(0);

    // Weather signals
    currentWeather = signal<WeatherData | null>(null);
    forecast = signal<ForecastDay[]>([]);
    weatherLoading = signal(true);
    weatherError = signal<string | null>(null);

    private clockInterval: ReturnType<typeof setInterval> | null = null;
    private weatherInterval: ReturnType<typeof setInterval> | null = null;

    // Journal widget computed values
    totalJournalEntries = computed(() => this.journalService.entries().length);

    // Budget widget computed values
    budgetStats = computed(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const transactions = this.budgetTransactions();
        const accounts = this.budgetAccounts();

        // Total balance across all accounts
        const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

        // This month's transactions
        const thisMonthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const income = thisMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = thisMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { totalBalance, income, expenses };
    });

    // Budget trend data - calculate running balance for last 7 days
    budgetTrendData = computed(() => {
        const transactions = this.budgetTransactions();
        const accounts = this.budgetAccounts();

        // Get current total balance
        const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

        // Get last 7 days
        const days: { date: Date; balance: number }[] = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Calculate balance changes for each day going backwards
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            days.push({ date, balance: 0 });
        }

        // Start with current balance and work backwards
        let runningBalance = currentBalance;

        // Sort transactions by date descending
        const sortedTransactions = [...transactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Set today's balance
        days[6].balance = runningBalance;

        // Calculate balance for each previous day
        for (let i = 5; i >= 0; i--) {
            const dayStart = days[i].date;
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            const nextDayStart = days[i + 1].date;

            // Find transactions between this day and next day
            const dayTransactions = sortedTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= dayStart && tDate < nextDayStart;
            });

            // Reverse the effect of these transactions to get previous balance
            for (const t of dayTransactions) {
                if (t.type === 'income') {
                    runningBalance -= t.amount;
                } else if (t.type === 'expense') {
                    runningBalance += t.amount;
                }
                // Transfers don't affect total balance
            }

            days[i].balance = runningBalance;
        }

        return days;
    });

    ngOnInit() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);

        // Load weather data
        this.loadWeather();
        // Refresh weather every 30 minutes
        this.weatherInterval = setInterval(() => this.loadWeather(), 30 * 60 * 1000);

        // Load budget data from localStorage
        this.loadBudgetData();
    }

    private loadBudgetData() {
        const transactionsData = localStorage.getItem('mybudget_transactions');
        const accountsData = localStorage.getItem('mybudget_accounts');

        if (transactionsData) {
            this.budgetTransactions.set(JSON.parse(transactionsData));
        }
        if (accountsData) {
            this.budgetAccounts.set(JSON.parse(accountsData));
        }
    }

    ngOnDestroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        if (this.weatherInterval) {
            clearInterval(this.weatherInterval);
        }
    }

    private updateClock() {
        const now = new Date();

        // Time format: HH:MM
        this.currentTime.set(now.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        }));

        // Date format: DD. MMMM YYYY
        this.currentDate.set(now.toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }));

        // Day of week
        this.currentDay.set(now.toLocaleDateString('de-DE', {
            weekday: 'long'
        }));

        // Calendar week (ISO 8601)
        this.currentWeek.set(this.getWeekNumber(now));
    }

    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    toggleSidebar() {
        this.sidebarService.toggleRight();
    }

    async loadWeather() {
        this.weatherLoading.set(true);
        this.weatherError.set(null);

        try {
            // Try to get user's location, fallback to Vienna
            let lat = 48.2082;  // Vienna default
            let lon = 16.3738;
            let locationName = 'Wien';

            try {
                const position = await this.getCurrentPosition();
                lat = position.coords.latitude;
                lon = position.coords.longitude;
                locationName = await this.getLocationName(lat, lon);
            } catch {
                // Use default Vienna location
            }

            // Fetch weather from Open-Meteo (FOSS, no API key needed)
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
            );

            if (!response.ok) {
                throw new Error('Weather API error');
            }

            const data = await response.json();

            // Set current weather
            this.currentWeather.set({
                temperature: Math.round(data.current.temperature_2m),
                weatherCode: data.current.weather_code,
                windSpeed: Math.round(data.current.wind_speed_10m),
                humidity: data.current.relative_humidity_2m,
                location: locationName
            });

            // Set forecast (today + next 2 days)
            const forecastDays: ForecastDay[] = data.daily.time.slice(0, 3).map((dateStr: string, index: number) => ({
                date: new Date(dateStr),
                tempMax: Math.round(data.daily.temperature_2m_max[index]),
                tempMin: Math.round(data.daily.temperature_2m_min[index]),
                weatherCode: data.daily.weather_code[index]
            }));
            this.forecast.set(forecastDays);

        } catch (error) {
            this.weatherError.set('Wetter konnte nicht geladen werden');
        } finally {
            this.weatherLoading.set(false);
        }
    }

    private getCurrentPosition(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 600000 // Cache for 10 minutes
            });
        });
    }

    private async getLocationName(lat: number, lon: number): Promise<string> {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
            );
            const data = await response.json();
            return data.address?.city || data.address?.town || data.address?.village || 'Unbekannt';
        } catch {
            return 'Unbekannt';
        }
    }

    getWeatherIcon(code: number): string {
        // WMO Weather interpretation codes
        const weatherIcons: Record<number, string> = {
            0: 'clear_day',           // Clear sky
            1: 'partly_cloudy_day',   // Mainly clear
            2: 'partly_cloudy_day',   // Partly cloudy
            3: 'cloud',               // Overcast
            45: 'foggy',              // Fog
            48: 'foggy',              // Depositing rime fog
            51: 'rainy',              // Light drizzle
            53: 'rainy',              // Moderate drizzle
            55: 'rainy',              // Dense drizzle
            56: 'weather_snowy',      // Light freezing drizzle
            57: 'weather_snowy',      // Dense freezing drizzle
            61: 'rainy',              // Slight rain
            63: 'rainy',              // Moderate rain
            65: 'rainy',              // Heavy rain
            66: 'weather_snowy',      // Light freezing rain
            67: 'weather_snowy',      // Heavy freezing rain
            71: 'weather_snowy',      // Slight snow
            73: 'weather_snowy',      // Moderate snow
            75: 'weather_snowy',      // Heavy snow
            77: 'weather_snowy',      // Snow grains
            80: 'rainy',              // Slight rain showers
            81: 'rainy',              // Moderate rain showers
            82: 'rainy',              // Violent rain showers
            85: 'weather_snowy',      // Slight snow showers
            86: 'weather_snowy',      // Heavy snow showers
            95: 'thunderstorm',       // Thunderstorm
            96: 'thunderstorm',       // Thunderstorm with slight hail
            99: 'thunderstorm'        // Thunderstorm with heavy hail
        };
        return weatherIcons[code] || 'cloud';
    }

    getWeatherDescription(code: number): string {
        const descriptions: Record<number, string> = {
            0: 'Klar',
            1: 'Überwiegend klar',
            2: 'Teilweise bewölkt',
            3: 'Bewölkt',
            45: 'Nebel',
            48: 'Nebel mit Reif',
            51: 'Leichter Nieselregen',
            53: 'Nieselregen',
            55: 'Starker Nieselregen',
            56: 'Gefrierender Nieselregen',
            57: 'Starker gefr. Nieselregen',
            61: 'Leichter Regen',
            63: 'Regen',
            65: 'Starker Regen',
            66: 'Gefrierender Regen',
            67: 'Starker gefr. Regen',
            71: 'Leichter Schneefall',
            73: 'Schneefall',
            75: 'Starker Schneefall',
            77: 'Schneekörner',
            80: 'Leichte Regenschauer',
            81: 'Regenschauer',
            82: 'Starke Regenschauer',
            85: 'Leichte Schneeschauer',
            86: 'Starke Schneeschauer',
            95: 'Gewitter',
            96: 'Gewitter mit Hagel',
            99: 'Schweres Gewitter mit Hagel'
        };
        return descriptions[code] || 'Unbekannt';
    }

    getDayName(date: Date, index: number): string {
        if (index === 0) return 'Heute';
        if (index === 1) return 'Morgen';
        return date.toLocaleDateString('de-DE', { weekday: 'short' });
    }

    // Budget widget helpers
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    getCurrentMonthName(): string {
        return new Date().toLocaleDateString('de-DE', { month: 'long' });
    }

    // Budget trend chart helpers
    getBudgetTrendLinePoints(): string {
        const data = this.budgetTrendData();
        if (data.length < 2) return '';

        const values = data.map(d => d.balance);
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const range = maxVal - minVal || 1;

        const width = 100;
        const height = 40;
        const padding = 2;

        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const normalizedValue = (d.balance - minVal) / range;
            const y = height - padding - (normalizedValue * (height - padding * 2));
            return `${x},${y}`;
        }).join(' ');
    }

    getBudgetTrendAreaPoints(): string {
        const linePoints = this.getBudgetTrendLinePoints();
        if (!linePoints) return '';

        const height = 40;
        return `0,${height} ${linePoints} 100,${height}`;
    }

    getLastTrendPoint(): { x: number; y: number } | null {
        const data = this.budgetTrendData();
        if (data.length < 2) return null;

        const values = data.map(d => d.balance);
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const range = maxVal - minVal || 1;

        const height = 40;
        const padding = 2;

        const lastIndex = data.length - 1;
        const x = 100;
        const normalizedValue = (data[lastIndex].balance - minVal) / range;
        const y = height - padding - (normalizedValue * (height - padding * 2));

        return { x, y };
    }
}
