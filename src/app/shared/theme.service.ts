import { Injectable, signal, effect } from '@angular/core';

export interface AccentColor {
    name: string;
    value: string;
    hover: string;
}

export const ACCENT_COLORS: AccentColor[] = [
    { name: 'Lila', value: '#a855f7', hover: '#9333ea' },
    { name: 'Blau', value: '#3b82f6', hover: '#2563eb' },
    { name: 'Grün', value: '#22c55e', hover: '#16a34a' },
    { name: 'Orange', value: '#f97316', hover: '#ea580c' },
    { name: 'Rot', value: '#ef4444', hover: '#dc2626' },
    { name: 'Grau', value: '#71717a', hover: '#52525b' },
    { name: 'Weiß', value: '#e4e4e7', hover: '#d4d4d8' },
];

const STORAGE_KEY = 'dashboard_accent_color';
const DEFAULT_COLOR = ACCENT_COLORS[0]; // Lila

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    currentAccentColor = signal<AccentColor>(this.loadAccentColor());

    constructor() {
        // Apply theme on initialization
        this.applyTheme(this.currentAccentColor());

        // Watch for changes and apply them
        effect(() => {
            const color = this.currentAccentColor();
            this.applyTheme(color);
            this.saveAccentColor(color);
        });
    }

    setAccentColor(color: AccentColor) {
        this.currentAccentColor.set(color);
    }

    private loadAccentColor(): AccentColor {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Find matching color from predefined list
                const found = ACCENT_COLORS.find(c => c.value === parsed.value);
                return found || DEFAULT_COLOR;
            }
        } catch (e) {
            console.warn('Failed to load accent color from storage', e);
        }
        return DEFAULT_COLOR;
    }

    private saveAccentColor(color: AccentColor) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(color));
        } catch (e) {
            console.warn('Failed to save accent color to storage', e);
        }
    }

    private applyTheme(color: AccentColor) {
        const root = document.documentElement;
        root.style.setProperty('--color-accent', color.value);
        root.style.setProperty('--color-accent-hover', color.hover);

        // Convert hex to RGB for rgba usage
        const rgb = this.hexToRgb(color.value);
        if (rgb) {
            root.style.setProperty('--color-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}