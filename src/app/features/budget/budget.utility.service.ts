import { Injectable } from '@angular/core';

/**
 * BudgetUtilityService - Pure helper functions with no state dependencies
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetUtilityService {

    /**
     * Format a number as EUR currency
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    /**
     * Format a date string to German locale (DD.MM.YYYY)
     */
    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Get today's date as ISO string (YYYY-MM-DD)
     */
    getTodayDateString(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Generate a unique ID from timestamp and random string
     */
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate HSL color from category ID hash
     */
    getCategoryColor(id: string): string {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 50%)`;
    }
}
