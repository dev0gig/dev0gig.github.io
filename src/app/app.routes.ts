import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { JournalPage } from './features/journal/journal-page';
import { BudgetPage } from './features/budget/budget-page';

export const routes: Routes = [
    { path: '', component: Dashboard },
    { path: 'journal', component: JournalPage },
    { path: 'budget', component: BudgetPage },
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
        path: 'audio-notes',
        loadComponent: () => import('./features/audio-notes/audio-notes-page').then(m => m.AudioNotesPage)
    },
    {
        path: 'mtg-inventory',
        loadComponent: () => import('./features/mtg-inventory/mtg-inventory.component').then(m => m.MtgInventoryComponent)
    }
];
