import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarService } from '../sidebar.service';
import { MusicPlayerComponent } from '../music-player/music-player.component';

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

@Component({
    selector: 'app-right-sidebar',
    standalone: true,
    imports: [CommonModule, MusicPlayerComponent],
    templateUrl: './right-sidebar.component.html',
    styleUrl: './right-sidebar.component.css'
})
export class RightSidebarComponent implements OnInit, OnDestroy {
    sidebarService = inject(SidebarService);

    // Clock signals
    currentTime = signal('');
    currentDate = signal('');

    // Weather signals
    currentWeather = signal<WeatherData | null>(null);
    forecast = signal<ForecastDay[]>([]);
    weatherLoading = signal(true);
    weatherError = signal<string | null>(null);

    // Calendar signals
    readonly japaneseWeekdays = ['月', '火', '水', '木', '金', '土', '日'];
    calendarWeeks = signal<{ kw: number, days: (Date | null)[] }[]>([]);
    currentMonthName = signal('');


    private clockInterval: ReturnType<typeof setInterval> | null = null;
    private weatherInterval: ReturnType<typeof setInterval> | null = null;

    ngOnInit() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);

        // Load weather data
        this.loadWeather();
        // Refresh weather every 30 minutes
        this.weatherInterval = setInterval(() => this.loadWeather(), 30 * 60 * 1000);

        this.generateCalendar();
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

        const newDate = now.toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Update calendar if day changed
        if (this.currentDate() && this.currentDate() !== newDate) {
            this.generateCalendar();
        }

        // Date format: DD. MMMM YYYY
        this.currentDate.set(newDate);
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
        // WMO Weather interpretation codes -> OpenWeatherMap icon codes
        // Format: https://openweathermap.org/img/wn/{icon}@2x.png
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 20;
        const dayNight = isDay ? 'd' : 'n';

        const weatherIcons: Record<number, string> = {
            0: `01${dayNight}`,           // Clear sky
            1: `02${dayNight}`,           // Mainly clear
            2: `03${dayNight}`,           // Partly cloudy
            3: '04d',                      // Overcast
            45: '50d',                     // Fog
            48: '50d',                     // Depositing rime fog
            51: '09d',                     // Light drizzle
            53: '09d',                     // Moderate drizzle
            55: '09d',                     // Dense drizzle
            56: '13d',                     // Light freezing drizzle
            57: '13d',                     // Dense freezing drizzle
            61: '10d',                     // Slight rain
            63: '10d',                     // Moderate rain
            65: '10d',                     // Heavy rain
            66: '13d',                     // Light freezing rain
            67: '13d',                     // Heavy freezing rain
            71: '13d',                     // Slight snow
            73: '13d',                     // Moderate snow
            75: '13d',                     // Heavy snow
            77: '13d',                     // Snow grains
            80: '09d',                     // Slight rain showers
            81: '09d',                     // Moderate rain showers
            82: '09d',                     // Violent rain showers
            85: '13d',                     // Slight snow showers
            86: '13d',                     // Heavy snow showers
            95: '11d',                     // Thunderstorm
            96: '11d',                     // Thunderstorm with slight hail
            99: '11d'                      // Thunderstorm with heavy hail
        };
        const iconCode = weatherIcons[code] || '03d';
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
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

    private generateCalendar() {
        const now = new Date();
        this.currentMonthName.set(now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }));

        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Get day of week for first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        // Convert to Monday-based (0 = Monday, ..., 6 = Sunday)
        let firstDayWeekday = firstDayOfMonth.getDay();
        firstDayWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

        const weeks: { kw: number, days: (Date | null)[] }[] = [];
        let currentWeek: (Date | null)[] = new Array(7).fill(null);
        let currentDayPointer = firstDayWeekday;

        // Fill initial empty days
        for (let i = 0; i < currentDayPointer; i++) {
            currentWeek[i] = null;
        }

        // Fill days of the month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month, day);
            currentWeek[currentDayPointer] = date;

            if (currentDayPointer === 6 || day === lastDayOfMonth.getDate()) {
                // End of week or end of month
                // If end of month and not Sunday, the rest is already null
                weeks.push({
                    kw: this.getWeekNumber(date),
                    days: [...currentWeek]
                });
                currentWeek = new Array(7).fill(null);
                currentDayPointer = 0;
            } else {
                currentDayPointer++;
            }
        }

        this.calendarWeeks.set(weeks);
    }

    isToday(date: Date | null): boolean {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }
}
