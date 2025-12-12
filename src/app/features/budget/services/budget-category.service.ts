import { Injectable, inject } from '@angular/core';
import { Category } from '../budget.models';
import { BudgetDataService } from './budget-data.service';
import { BudgetUtilityService } from '../budget.utility.service';

/**
 * BudgetCategoryService - Manages category CRUD operations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetCategoryService {

    private dataService = inject(BudgetDataService);
    private utilityService = inject(BudgetUtilityService);

    // ==================== CRUD Operations ====================

    addCategory(name: string, type: 'income' | 'expense' | 'both') {
        console.log('[CategoryService] addCategory called with name:', name, 'type:', type);

        // Validate data to prevent corrupted entries
        if (!name || typeof name !== 'string' || name.trim() === '') {
            console.warn('[CategoryService] addCategory: Invalid data - missing or invalid name');
            return;
        }
        if (!['income', 'expense', 'both'].includes(type)) {
            console.warn('[CategoryService] addCategory: Invalid data - invalid type:', type);
            return;
        }

        const category: Category = {
            id: this.utilityService.generateId(),
            name: name.trim(),
            type
        };
        console.log('[CategoryService] Created new category object:', JSON.stringify(category));
        console.log('[CategoryService] Categories BEFORE update:', JSON.stringify(this.dataService.categories()));
        this.dataService.categories.update(c => [...c, category]);
        console.log('[CategoryService] Categories AFTER update:', JSON.stringify(this.dataService.categories()));
        this.dataService.saveCategories();
        console.log('[CategoryService] Categories saved to localStorage');
    }

    updateCategory(id: string, name: string, type: 'income' | 'expense' | 'both') {
        this.dataService.categories.update(categories =>
            categories.map(c => c.id === id ? { ...c, name, type } : c)
        );
        this.dataService.saveCategories();
    }

    deleteCategory(id: string) {
        this.dataService.categories.update(c => c.filter(category => category.id !== id));
        this.dataService.saveCategories();
    }

    deleteAllCategories() {
        console.log('[CategoryService] deleteAllCategories called');
        console.log('[CategoryService] Categories BEFORE:', JSON.stringify(this.dataService.categories()));
        this.dataService.categories.set([]);
        this.dataService.saveCategories();
        console.log('[CategoryService] Categories AFTER:', JSON.stringify(this.dataService.categories()));
        console.log('[CategoryService] Categories saved to localStorage');
    }

    deleteSelectedCategories(ids: string[]) {
        console.log('[CategoryService] deleteSelectedCategories called with ids:', ids);
        console.log('[CategoryService] Categories BEFORE:', JSON.stringify(this.dataService.categories()));
        this.dataService.categories.update(c => c.filter(category => !ids.includes(category.id)));
        this.dataService.saveCategories();
        console.log('[CategoryService] Categories AFTER:', JSON.stringify(this.dataService.categories()));
        console.log('[CategoryService] Categories saved to localStorage');
    }

    // ==================== Default Categories ====================

    /**
     * Add default categories (can be called manually via settings)
     * Adds only categories that don't already exist (by name)
     * @returns number of categories added
     */
    addDefaultCategories(): number {
        const defaultCategories: { name: string; type: 'income' | 'expense' | 'both' }[] = [
            // Income categories
            { name: 'Gehalt', type: 'income' },
            { name: 'Nebeneinkommen', type: 'income' },
            { name: 'Kindergeld', type: 'income' },
            { name: 'Zinsen & Dividenden', type: 'income' },
            { name: 'Rückerstattung', type: 'income' },

            // Expense categories
            { name: 'Miete & Wohnen', type: 'expense' },
            { name: 'Lebensmittel', type: 'expense' },
            { name: 'Transport & Auto', type: 'expense' },
            { name: 'Versicherungen', type: 'expense' },
            { name: 'Strom & Energie', type: 'expense' },
            { name: 'Internet & Telefon', type: 'expense' },
            { name: 'Gesundheit', type: 'expense' },
            { name: 'Freizeit & Hobby', type: 'expense' },
            { name: 'Restaurant & Café', type: 'expense' },
            { name: 'Kleidung', type: 'expense' },
            { name: 'Haushalt', type: 'expense' },
            { name: 'Abonnements', type: 'expense' },
            { name: 'Bildung', type: 'expense' },
            { name: 'Urlaub & Reisen', type: 'expense' },
            { name: 'Sparen & Investieren', type: 'expense' },

            // Both (can be income or expense)
            { name: 'Geschenke', type: 'both' },
            { name: 'Sonstiges', type: 'both' }
        ];

        // Get existing category names (lowercase for comparison)
        const existingNames = new Set(this.dataService.categories().map(c => c.name.toLowerCase()));

        // Filter out categories that already exist
        const newCategories: Category[] = defaultCategories
            .filter(cat => !existingNames.has(cat.name.toLowerCase()))
            .map(cat => ({
                id: this.utilityService.generateId(),
                name: cat.name,
                type: cat.type
            }));

        if (newCategories.length > 0) {
            this.dataService.categories.update(c => [...c, ...newCategories]);
            this.dataService.saveCategories();
        }

        console.log('[CategoryService] Added default categories:', newCategories.length);
        return newCategories.length;
    }

    // ==================== Helper Methods ====================

    getOrCreateCategory(categoryNameRaw: string, categoriesMap: Map<string, Category>): string {
        const categoryName = categoryNameRaw.trim();

        let category = categoriesMap.get(categoryName);
        if (!category) {
            category = {
                id: this.utilityService.generateId(),
                name: categoryName,
                type: 'both'
            };
            categoriesMap.set(categoryName, category);
        }
        return category.id;
    }
}
