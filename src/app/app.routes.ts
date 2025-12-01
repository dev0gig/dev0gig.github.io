import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { JournalPage } from './features/journal/journal-page';
import { BudgetPage } from './features/budget/budget-page';

export const routes: Routes = [
    { path: '', component: Dashboard },
    { path: 'tools', component: JournalPage },
    { path: 'budget', component: BudgetPage }
];
