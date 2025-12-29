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
        path: 'manga-builder',
        loadComponent: () => import('./features/manga-builder/manga-builder-page').then(m => m.MangaBuilderPage)
    },
    {
        path: 'manga-reader',
        loadComponent: () => import('./features/manga-reader/manga-reader-page').then(m => m.MangaReaderPage)
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
