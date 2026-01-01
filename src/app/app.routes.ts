import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'journal',
        loadComponent: () => import('./features/journal/journal-page').then(m => m.JournalPage)
    },
    {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget-page').then(m => m.BudgetPage)
    },
    {
        path: 'savings-simulator',
        loadComponent: () => import('./features/savings-simulator/savings-simulator.component').then(m => m.SavingsSimulatorComponent)
    },
    {
        path: 'mtg-inventory',
        loadComponent: () => import('./features/mtg-inventory/mtg-inventory.component').then(m => m.MtgInventoryComponent)
    },
    {
        path: 'flashcards',
        loadComponent: () => import('./features/flashcards/flashcards.component').then(m => m.FlashcardsComponent)
    }
];
