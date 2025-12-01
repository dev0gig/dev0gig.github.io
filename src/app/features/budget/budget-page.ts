import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { BudgetCalendar } from './calendar/calendar';

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category: string;
    account: string;
    toAccount?: string; // For transfers
    date: string;
}

interface Account {
    id: string;
    name: string;
    balance: number;
}

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
}

@Component({
    selector: 'app-budget-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, AppsLauncher, BudgetCalendar],
    templateUrl: './budget-page.html',
    styleUrls: ['./budget-page.css']
})
export class BudgetPage {
    transactions = signal<Transaction[]>([]);
    accounts = signal<Account[]>([]);

    categories = signal<Category[]>([]);

    editingCategory = signal<Category | null>(null);

    showTransactionModal = signal(false);
    showAccountModal = signal(false);
    showCategoryModal = signal(false);
    showSettingsModal = signal(false);
    settingsView = signal<'main' | 'accounts' | 'categories'>('main');

    selectedMonth = signal(new Date());

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
        if (!this.showSettingsModal()) {
            this.settingsView.set('main'); // Reset view when closing
        }
    }

    currentTransactionType = signal<'income' | 'expense' | 'transfer'>('expense');

    constructor() {
        this.loadData();
        this.initializeDefaultCategories();
        this.initializeSampleData();
    }

    private loadData() {
        const transactionsData = localStorage.getItem('mybudget_transactions');
        const accountsData = localStorage.getItem('mybudget_accounts');
        const categoriesData = localStorage.getItem('mybudget_categories');

        if (transactionsData) this.transactions.set(JSON.parse(transactionsData));
        if (accountsData) this.accounts.set(JSON.parse(accountsData));
        if (categoriesData) this.categories.set(JSON.parse(categoriesData));
    }

    private initializeDefaultCategories() {
        if (this.categories().length === 0) {
            const defaultCategories: Category[] = [
                { id: this.generateId(), name: 'Lebensmittel', type: 'expense' },
                { id: this.generateId(), name: 'Transport', type: 'expense' },
                { id: this.generateId(), name: 'Wohnung', type: 'expense' },
                { id: this.generateId(), name: 'Unterhaltung', type: 'expense' },
                { id: this.generateId(), name: 'Gesundheit', type: 'expense' },
                { id: this.generateId(), name: 'Gehalt', type: 'income' },
                { id: this.generateId(), name: 'Sonstiges', type: 'both' },
                { id: this.generateId(), name: 'Haushalt', type: 'expense' }
            ];
            this.categories.set(defaultCategories);
            this.saveCategories();
        }
    }

    private initializeSampleData() {
        // Only initialize if no transactions exist
        if (this.transactions().length > 0) return;

        // Sample accounts
        const sampleAccounts: Account[] = [
            { id: 'acc_giro', name: 'Girokonto DE123', balance: 0 },
            { id: 'acc_kredit', name: 'Kreditkarte XX789', balance: 0 },
            { id: 'acc_spar', name: 'Sparkonto DE456', balance: 0 }
        ];

        // Sample categories
        const sampleCategories: Category[] = [
            { id: 'cat_einkommen', name: 'Einkommen', type: 'income' },
            { id: 'cat_wohnen', name: 'Wohnen', type: 'expense' },
            { id: 'cat_lebensmittel', name: 'Lebensmittel', type: 'expense' },
            { id: 'cat_sparen', name: 'Sparen', type: 'both' },
            { id: 'cat_freizeit', name: 'Freizeit', type: 'expense' },
            { id: 'cat_unterhaltung', name: 'Unterhaltung', type: 'expense' },
            { id: 'cat_transport', name: 'Transport', type: 'expense' },
            { id: 'cat_bildung', name: 'Bildung', type: 'expense' },
            { id: 'cat_gesundheit', name: 'Gesundheit', type: 'expense' },
            { id: 'cat_schulden', name: 'Schulden', type: 'both' },
            { id: 'cat_sonstiges', name: 'Sonstiges', type: 'both' },
            { id: 'cat_versicherung', name: 'Versicherung', type: 'expense' },
            { id: 'cat_kommunikation', name: 'Kommunikation', type: 'expense' },
            { id: 'cat_bargeld', name: 'Bargeld', type: 'expense' },
            { id: 'cat_gebuehren', name: 'Gebühren', type: 'expense' }
        ];

        // Sample transactions data
        const sampleData = [
            { date: '2025-11-01', desc: 'Gehalt', account: 'acc_giro', category: 'cat_einkommen', amount: 4500.00 },
            { date: '2025-11-01', desc: 'Miete November', account: 'acc_giro', category: 'cat_wohnen', amount: -1250.00 },
            { date: '2025-11-02', desc: 'Lebensmittel (Edeka)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -45.89 },
            { date: '2025-11-03', desc: 'Sparen', account: 'acc_giro', category: 'cat_sparen', amount: -500.00 },
            { date: '2025-11-03', desc: 'Übertrag Einzahlung', account: 'acc_spar', category: 'cat_sparen', amount: 500.00 },
            { date: '2025-11-04', desc: 'Kinobesuch', account: 'acc_giro', category: 'cat_freizeit', amount: -32.00 },
            { date: '2025-11-05', desc: 'Netflix Abo', account: 'acc_kredit', category: 'cat_unterhaltung', amount: -12.99 },
            { date: '2025-11-06', desc: 'Bahnticket', account: 'acc_giro', category: 'cat_transport', amount: -19.90 },
            { date: '2025-11-07', desc: 'Bücherkauf', account: 'acc_kredit', category: 'cat_bildung', amount: -25.50 },
            { date: '2025-11-08', desc: 'Stromabschlag', account: 'acc_giro', category: 'cat_wohnen', amount: -85.00 },
            { date: '2025-11-09', desc: 'Lebensmittel (Rewe)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -67.35 },
            { date: '2025-11-10', desc: 'Restaurantbesuch', account: 'acc_giro', category: 'cat_freizeit', amount: -75.40 },
            { date: '2025-11-11', desc: 'Überweisung Schulden', account: 'acc_spar', category: 'cat_schulden', amount: -150.00 },
            { date: '2025-11-11', desc: 'Rückzahlung', account: 'acc_giro', category: 'cat_einkommen', amount: 150.00 },
            { date: '2025-11-12', desc: 'Fitnessstudio', account: 'acc_kredit', category: 'cat_gesundheit', amount: -49.90 },
            { date: '2025-11-13', desc: 'Online-Shopping', account: 'acc_kredit', category: 'cat_sonstiges', amount: -112.50 },
            { date: '2025-11-14', desc: 'Tanken', account: 'acc_giro', category: 'cat_transport', amount: -55.80 },
            { date: '2025-11-15', desc: 'Lebensmittel (Lidl)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -33.10 },
            { date: '2025-11-16', desc: 'Dividendenzahlung', account: 'acc_spar', category: 'cat_einkommen', amount: 15.20 },
            { date: '2025-11-17', desc: 'Kaffee', account: 'acc_kredit', category: 'cat_freizeit', amount: -4.50 },
            { date: '2025-11-18', desc: 'Versicherung', account: 'acc_giro', category: 'cat_versicherung', amount: -65.99 },
            { date: '2025-11-19', desc: 'Software-Lizenz', account: 'acc_kredit', category: 'cat_bildung', amount: -9.99 },
            { date: '2025-11-20', desc: 'Lebensmittel (Edeka)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -51.77 },
            { date: '2025-11-21', desc: 'Konzertkarten', account: 'acc_kredit', category: 'cat_freizeit', amount: -90.00 },
            { date: '2025-11-22', desc: 'Geldautomat Abhebung', account: 'acc_giro', category: 'cat_bargeld', amount: -100.00 },
            { date: '2025-11-23', desc: 'Telefonrechnung', account: 'acc_giro', category: 'cat_kommunikation', amount: -39.95 },
            { date: '2025-11-24', desc: 'Geschenk', account: 'acc_kredit', category: 'cat_sonstiges', amount: -40.00 },
            { date: '2025-11-25', desc: 'Zinsen Gutschrift', account: 'acc_spar', category: 'cat_einkommen', amount: 0.55 },
            { date: '2025-11-26', desc: 'Werkzeugkauf', account: 'acc_giro', category: 'cat_sonstiges', amount: -19.99 },
            { date: '2025-11-27', desc: 'Apotheke', account: 'acc_kredit', category: 'cat_gesundheit', amount: -15.20 },
            { date: '2025-11-28', desc: 'Online-Kurs', account: 'acc_kredit', category: 'cat_bildung', amount: -49.00 },
            { date: '2025-11-29', desc: 'Lebensmittel (Aldi)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -22.60 },
            { date: '2025-11-30', desc: 'Zahlung Kreditkarte', account: 'acc_giro', category: 'cat_schulden', amount: -450.00 },
            { date: '2025-12-01', desc: 'Lebensmittel (Edeka)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -40.15 },
            { date: '2025-12-02', desc: 'Sparen', account: 'acc_giro', category: 'cat_sparen', amount: -200.00 },
            { date: '2025-12-02', desc: 'Übertrag Einzahlung', account: 'acc_spar', category: 'cat_sparen', amount: 200.00 },
            { date: '2025-12-03', desc: 'Geschenk', account: 'acc_giro', category: 'cat_sonstiges', amount: -55.00 },
            { date: '2025-12-04', desc: 'Bäckerei', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -8.50 },
            { date: '2025-12-05', desc: 'Internet-Rechnung', account: 'acc_giro', category: 'cat_kommunikation', amount: -34.99 },
            { date: '2025-12-06', desc: 'Tanken', account: 'acc_kredit', category: 'cat_transport', amount: -61.20 },
            { date: '2025-12-07', desc: 'Hobby-Zubehör', account: 'acc_giro', category: 'cat_freizeit', amount: -28.50 },
            { date: '2025-12-08', desc: 'Lebensmittel (Rewe)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -72.90 },
            { date: '2025-12-09', desc: 'Abendessen', account: 'acc_giro', category: 'cat_freizeit', amount: -48.60 },
            { date: '2025-12-10', desc: 'Software-Abo', account: 'acc_kredit', category: 'cat_unterhaltung', amount: -7.99 },
            { date: '2025-12-11', desc: 'Übertrag Auszahlung', account: 'acc_spar', category: 'cat_sonstiges', amount: -100.00 },
            { date: '2025-12-11', desc: 'Einzahlung aus Sparkonto', account: 'acc_giro', category: 'cat_sonstiges', amount: 100.00 },
            { date: '2025-12-12', desc: 'Kleidung', account: 'acc_kredit', category: 'cat_sonstiges', amount: -89.90 },
            { date: '2025-12-13', desc: 'Lebensmittel (Lidl)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -35.40 },
            { date: '2025-12-14', desc: 'Sportausrüstung', account: 'acc_kredit', category: 'cat_gesundheit', amount: -149.00 },
            { date: '2025-12-15', desc: 'Reparatur Auto', account: 'acc_giro', category: 'cat_transport', amount: -180.00 },
            { date: '2025-12-16', desc: 'Lebensmittel (Aldi)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -29.75 },
            { date: '2025-12-17', desc: 'Online-Shopping', account: 'acc_kredit', category: 'cat_sonstiges', amount: -45.60 },
            { date: '2025-12-18', desc: 'Gebühren Bank', account: 'acc_giro', category: 'cat_gebuehren', amount: -5.00 },
            { date: '2025-12-19', desc: 'Weihnachtsmarkt', account: 'acc_giro', category: 'cat_freizeit', amount: -22.50 },
            { date: '2025-12-20', desc: 'Lebensmittel (Edeka)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -55.30 },
            { date: '2025-12-21', desc: 'Übertrag Einzahlung', account: 'acc_spar', category: 'cat_sparen', amount: 100.00 },
            { date: '2025-12-22', desc: 'Geschenk', account: 'acc_giro', category: 'cat_sonstiges', amount: -99.00 },
            { date: '2025-12-23', desc: 'Lebensmittel (Rewe)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -110.50 },
            { date: '2025-12-24', desc: 'Lastschrift Beitrag', account: 'acc_spar', category: 'cat_versicherung', amount: -12.50 },
            { date: '2025-12-25', desc: 'Rückerstattung Online', account: 'acc_kredit', category: 'cat_einkommen', amount: 15.00 },
            { date: '2025-12-26', desc: 'Spende', account: 'acc_giro', category: 'cat_sonstiges', amount: -20.00 },
            { date: '2025-12-27', desc: 'Buch', account: 'acc_kredit', category: 'cat_bildung', amount: -18.99 },
            { date: '2025-12-28', desc: 'Tanken', account: 'acc_giro', category: 'cat_transport', amount: -45.90 },
            { date: '2025-12-29', desc: 'Silvester-Einkauf', account: 'acc_giro', category: 'cat_lebensmittel', amount: -78.20 },
            { date: '2025-12-30', desc: 'Streaming-Abo', account: 'acc_kredit', category: 'cat_unterhaltung', amount: -9.99 },
            { date: '2025-12-31', desc: 'Zahlung Kreditkarte', account: 'acc_giro', category: 'cat_schulden', amount: -300.00 },
            { date: '2026-01-01', desc: 'Gehalt', account: 'acc_giro', category: 'cat_einkommen', amount: 4500.00 },
            { date: '2026-01-01', desc: 'Miete Januar', account: 'acc_giro', category: 'cat_wohnen', amount: -1250.00 },
            { date: '2026-01-02', desc: 'Lebensmittel (Lidl)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -38.70 },
            { date: '2026-01-03', desc: 'Sparen', account: 'acc_giro', category: 'cat_sparen', amount: -500.00 },
            { date: '2026-01-03', desc: 'Übertrag Einzahlung', account: 'acc_spar', category: 'cat_sparen', amount: 500.00 },
            { date: '2026-01-04', desc: 'Museumseintritt', account: 'acc_giro', category: 'cat_freizeit', amount: -18.00 },
            { date: '2026-01-05', desc: 'Amazon Prime', account: 'acc_kredit', category: 'cat_unterhaltung', amount: -8.99 },
            { date: '2026-01-06', desc: 'Busfahrkarte', account: 'acc_giro', category: 'cat_transport', amount: -2.90 },
            { date: '2026-01-07', desc: 'Zeitschrift', account: 'acc_kredit', category: 'cat_bildung', amount: -6.50 },
            { date: '2026-01-08', desc: 'Heizkosten Vorauszahlung', account: 'acc_giro', category: 'cat_wohnen', amount: -75.00 },
            { date: '2026-01-09', desc: 'Lebensmittel (Aldi)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -59.45 },
            { date: '2026-01-10', desc: 'Kino', account: 'acc_giro', category: 'cat_freizeit', amount: -24.00 },
            { date: '2026-01-11', desc: 'Überweisung Schulden', account: 'acc_spar', category: 'cat_schulden', amount: -50.00 },
            { date: '2026-01-11', desc: 'Rückzahlung', account: 'acc_giro', category: 'cat_einkommen', amount: 50.00 },
            { date: '2026-01-12', desc: 'Schwimmbad', account: 'acc_kredit', category: 'cat_gesundheit', amount: -14.50 },
            { date: '2026-01-13', desc: 'Online-Bestellung', account: 'acc_kredit', category: 'cat_sonstiges', amount: -78.20 },
            { date: '2026-01-14', desc: 'Tanken', account: 'acc_giro', category: 'cat_transport', amount: -60.10 },
            { date: '2026-01-15', desc: 'Lebensmittel (Edeka)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -41.90 },
            { date: '2026-01-16', desc: 'Zinsen Kapital', account: 'acc_spar', category: 'cat_einkommen', amount: 0.80 },
            { date: '2026-01-17', desc: 'Café', account: 'acc_kredit', category: 'cat_freizeit', amount: -5.50 },
            { date: '2026-01-18', desc: 'Haftpflichtversicherung', account: 'acc_giro', category: 'cat_versicherung', amount: -79.99 },
            { date: '2026-01-19', desc: 'Online-Lernplattform', account: 'acc_kredit', category: 'cat_bildung', amount: -19.99 },
            { date: '2026-01-20', desc: 'Lebensmittel (Rewe)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -48.33 },
            { date: '2026-01-21', desc: 'Theaterkarten', account: 'acc_kredit', category: 'cat_freizeit', amount: -120.00 },
            { date: '2026-01-22', desc: 'Geldautomat Abhebung', account: 'acc_giro', category: 'cat_bargeld', amount: -50.00 },
            { date: '2026-01-23', desc: 'Handyrechnung', account: 'acc_giro', category: 'cat_kommunikation', amount: -29.95 },
            { date: '2026-01-24', desc: 'Blumen', account: 'acc_kredit', category: 'cat_sonstiges', amount: -30.00 },
            { date: '2026-01-25', desc: 'Zinsen Gutschrift', account: 'acc_spar', category: 'cat_einkommen', amount: 1.20 },
            { date: '2026-01-26', desc: 'Büromaterial', account: 'acc_giro', category: 'cat_sonstiges', amount: -14.99 },
            { date: '2026-01-27', desc: 'Arztkosten', account: 'acc_kredit', category: 'cat_gesundheit', amount: -25.00 },
            { date: '2026-01-28', desc: 'Webhosting', account: 'acc_kredit', category: 'cat_bildung', amount: -59.00 },
            { date: '2026-01-29', desc: 'Lebensmittel (Lidl)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -27.10 },
            { date: '2026-01-30', desc: 'Zahlung Kreditkarte', account: 'acc_giro', category: 'cat_schulden', amount: -500.00 },
            { date: '2026-02-01', desc: 'Lebensmittel (Edeka)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -42.99 },
            { date: '2026-02-02', desc: 'Sparen', account: 'acc_giro', category: 'cat_sparen', amount: -150.00 },
            { date: '2026-02-02', desc: 'Übertrag Einzahlung', account: 'acc_spar', category: 'cat_sparen', amount: 150.00 },
            { date: '2026-02-03', desc: 'Geschenk', account: 'acc_giro', category: 'cat_sonstiges', amount: -45.00 },
            { date: '2026-02-04', desc: 'Bäckerei', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -7.50 },
            { date: '2026-02-05', desc: 'Vodafone Rechnung', account: 'acc_giro', category: 'cat_kommunikation', amount: -49.99 },
            { date: '2026-02-06', desc: 'Tanken', account: 'acc_kredit', category: 'cat_transport', amount: -58.50 },
            { date: '2026-02-07', desc: 'Bastelbedarf', account: 'acc_giro', category: 'cat_freizeit', amount: -15.50 },
            { date: '2026-02-08', desc: 'Lebensmittel (Aldi)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -65.20 },
            { date: '2026-02-09', desc: 'Mittagessen', account: 'acc_giro', category: 'cat_freizeit', amount: -35.80 },
            { date: '2026-02-10', desc: 'Spotify Abo', account: 'acc_kredit', category: 'cat_unterhaltung', amount: -14.99 },
            { date: '2026-02-11', desc: 'Übertrag Auszahlung', account: 'acc_spar', category: 'cat_sonstiges', amount: -50.00 },
            { date: '2026-02-11', desc: 'Einzahlung aus Sparkonto', account: 'acc_giro', category: 'cat_sonstiges', amount: 50.00 },
            { date: '2026-02-12', desc: 'Schuhe', account: 'acc_kredit', category: 'cat_sonstiges', amount: -79.90 },
            { date: '2026-02-13', desc: 'Lebensmittel (Rewe)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -39.10 },
            { date: '2026-02-14', desc: 'Massage', account: 'acc_kredit', category: 'cat_gesundheit', amount: -60.00 },
            { date: '2026-02-15', desc: 'KFZ-Steuer', account: 'acc_giro', category: 'cat_transport', amount: -120.00 },
            { date: '2026-02-16', desc: 'Lebensmittel (Edeka)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -31.50 },
            { date: '2026-02-17', desc: 'Online-Shopping', account: 'acc_kredit', category: 'cat_sonstiges', amount: -55.90 },
            { date: '2026-02-18', desc: 'Gebühren Bank', account: 'acc_giro', category: 'cat_gebuehren', amount: -5.00 },
            { date: '2026-02-19', desc: 'Zoo-Eintritt', account: 'acc_giro', category: 'cat_freizeit', amount: -38.00 },
            { date: '2026-02-20', desc: 'Lebensmittel (Lidl)', account: 'acc_kredit', category: 'cat_lebensmittel', amount: -51.40 },
            { date: '2026-02-21', desc: 'Übertrag Einzahlung', account: 'acc_spar', category: 'cat_sparen', amount: 50.00 },
            { date: '2026-02-22', desc: 'Geschenk', account: 'acc_giro', category: 'cat_sonstiges', amount: -75.00 },
            { date: '2026-02-23', desc: 'Lebensmittel (Aldi)', account: 'acc_giro', category: 'cat_lebensmittel', amount: -95.80 },
            { date: '2026-02-24', desc: 'Lastschrift Beitrag', account: 'acc_spar', category: 'cat_versicherung', amount: -12.50 },
            { date: '2026-02-25', desc: 'Rückerstattung', account: 'acc_kredit', category: 'cat_einkommen', amount: 20.00 },
            { date: '2026-02-26', desc: 'Spende', account: 'acc_giro', category: 'cat_sonstiges', amount: -10.00 },
            { date: '2026-02-27', desc: 'Online-Magazin', account: 'acc_kredit', category: 'cat_bildung', amount: -10.99 },
            { date: '2026-02-28', desc: 'Tanken', account: 'acc_giro', category: 'cat_transport', amount: -49.50 },
            { date: '2026-02-28', desc: 'Zahlung Kreditkarte', account: 'acc_giro', category: 'cat_schulden', amount: -350.00 }
        ];

        // Create transactions and update account balances
        const transactions: Transaction[] = [];
        const accountBalances = new Map<string, number>();
        sampleAccounts.forEach(a => accountBalances.set(a.id, 0));

        sampleData.forEach((item, index) => {
            const type: 'income' | 'expense' = item.amount >= 0 ? 'income' : 'expense';
            const transaction: Transaction = {
                id: `sample_${index}`,
                type,
                amount: Math.abs(item.amount),
                description: item.desc,
                category: item.category,
                account: item.account,
                date: item.date
            };
            transactions.push(transaction);

            // Update account balance
            const currentBalance = accountBalances.get(item.account) || 0;
            accountBalances.set(item.account, currentBalance + item.amount);
        });

        // Update account balances
        sampleAccounts.forEach(a => {
            a.balance = accountBalances.get(a.id) || 0;
        });

        // Set the data
        this.accounts.set(sampleAccounts);
        this.categories.set(sampleCategories);
        this.transactions.set(transactions);

        // Save to localStorage
        this.saveAccounts();
        this.saveCategories();
        this.saveTransactions();
    }

    toggleTransactionModal() {
        this.showTransactionModal.set(!this.showTransactionModal());
    }

    toggleAccountModal() {
        this.showAccountModal.set(!this.showAccountModal());
    }

    toggleCategoryModal() {
        this.showCategoryModal.set(!this.showCategoryModal());
    }

    setTransactionType(type: 'income' | 'expense' | 'transfer') {
        this.currentTransactionType.set(type);
    }

    expandedTransactionId = signal<string | null>(null);
    editingTransaction = signal<Transaction | null>(null);
    editingAccount = signal<Account | null>(null);
    inlineEditingTransactionId = signal<string | null>(null);
    inlineTransactionTypes = signal<Map<string, 'income' | 'expense' | 'transfer'>>(new Map());

    toggleExpansion(id: string) {
        if (this.expandedTransactionId() === id) {
            this.expandedTransactionId.set(null);
        } else {
            this.expandedTransactionId.set(id);
        }
    }

    deleteTransaction(id: string) {
        const transaction = this.transactions().find(t => t.id === id);
        if (!transaction) return;

        if (confirm('Möchten Sie diese Transaktion wirklich löschen?')) {
            this.revertTransactionBalance(transaction);
            this.transactions.update(t => t.filter(item => item.id !== id));
            this.saveTransactions();
            this.saveAccounts();
        }
    }

    deleteAllTransactions() {
        if (confirm('Sind Sie sicher, dass Sie ALLE Transaktionen löschen möchten? Dies kann nicht rückgängig gemacht werden.')) {
            // Revert balances for all transactions
            this.transactions().forEach(t => this.revertTransactionBalance(t));

            // Clear transactions
            this.transactions.set([]);

            // Save changes
            this.saveTransactions();
            this.saveAccounts();
        }
    }

    openEditModal(transaction: Transaction) {
        this.editingTransaction.set(transaction);
        this.currentTransactionType.set(transaction.type);
        this.showTransactionModal.set(true);
        // Date input needs explicit setting if not using ngModel fully or if timing issues
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) dateInput.value = transaction.date;
        }, 0);
    }

    onTransactionSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const type = this.currentTransactionType();
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string;
        const categoryId = formData.get('category') as string;
        const accountId = formData.get('account') as string;
        const toAccountId = formData.get('toAccount') as string;
        const date = formData.get('date') as string;

        const transactionData: Transaction = {
            id: this.editingTransaction() ? this.editingTransaction()!.id : this.generateId(),
            type,
            amount,
            description,
            category: categoryId,
            account: accountId,
            toAccount: type === 'transfer' ? toAccountId : undefined,
            date
        };

        if (this.editingTransaction()) {
            const oldTransaction = this.editingTransaction()!;
            this.revertTransactionBalance(oldTransaction);
            this.applyTransactionBalance(transactionData);

            this.transactions.update(t => t.map(item => item.id === transactionData.id ? transactionData : item));
        } else {
            this.applyTransactionBalance(transactionData);
            this.transactions.update(t => [...t, transactionData]);
        }

        this.saveTransactions();
        this.saveAccounts();
        this.toggleTransactionModal();
        form.reset();
        this.editingTransaction.set(null); // Reset editing state
        this.setTodayDate();
    }

    private revertTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.updateAccountBalance(t.account, t.amount); // Add back to source
            this.updateAccountBalance(t.toAccount, -t.amount); // Deduct from dest
        } else if (t.type === 'income') {
            this.updateAccountBalance(t.account, -t.amount); // Deduct
        } else {
            this.updateAccountBalance(t.account, t.amount); // Add back
        }
    }

    private applyTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.updateAccountBalance(t.account, -t.amount);
            this.updateAccountBalance(t.toAccount, t.amount);
        } else if (t.type === 'income') {
            this.updateAccountBalance(t.account, t.amount);
        } else {
            this.updateAccountBalance(t.account, -t.amount);
        }
    }

    openEditAccountModal(account: Account) {
        this.editingAccount.set(account);
        this.showAccountModal.set(true);
    }

    deleteAccount(id: string) {
        if (confirm('Möchten Sie dieses Konto wirklich löschen?')) {
            this.accounts.update(a => a.filter(account => account.id !== id));
            this.saveAccounts();
            if (this.selectedAccountId() === id) {
                this.selectAccount(null);
            }
        }
    }

    onAccountSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('accountName') as string;
        const balance = parseFloat(formData.get('accountBalance') as string);

        if (this.editingAccount()) {
            const updatedAccount = { ...this.editingAccount()!, name, balance };
            this.accounts.update(accounts =>
                accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a)
            );
        } else {
            const account: Account = {
                id: this.generateId(),
                name,
                balance
            };
            this.accounts.update(a => [...a, account]);
        }

        this.saveAccounts();
        this.toggleAccountModal();
        this.editingAccount.set(null);
        form.reset();
    }

    onCategorySubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('categoryName') as string;
        const type = (formData.get('categoryType') as 'income' | 'expense' | 'both') || 'both';

        if (this.editingCategory()) {
            const updatedCategory = { ...this.editingCategory()!, name, type };
            this.categories.update(categories =>
                categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
            );
        } else {
            const category: Category = {
                id: this.generateId(),
                name,
                type
            };
            this.categories.update(c => [...c, category]);
        }

        this.saveCategories();
        this.toggleCategoryModal();
        this.editingCategory.set(null);
        form.reset();
    }

    deleteCategory(id: string) {
        if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
            this.categories.update(c => c.filter(category => category.id !== id));
            this.saveCategories();
        }
    }

    openEditCategoryModal(category: Category) {
        this.editingCategory.set(category);
        this.showCategoryModal.set(true);
    }

    selectedAccountId = signal<string | null>(null);
    searchQuery = signal<string>('');

    selectAccount(id: string | null) {
        if (this.selectedAccountId() === id) {
            this.selectedAccountId.set(null);
        } else {
            this.selectedAccountId.set(id);
        }
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    getStats() {
        const now = new Date();
        // Use selectedMonth for stats or keep it current month?
        // The user said "pro seite sollen transaktionen von diesem monat angezeigt werden" (per page transactions of THIS month should be displayed).
        // Usually stats follow the view. Let's use selectedMonth for stats too.
        const currentMonth = this.selectedMonth().getMonth();
        const currentYear = this.selectedMonth().getFullYear();

        // 1. Calculate Balance (Account Filter Only)
        let balance = 0;
        if (this.selectedAccountId()) {
            const account = this.accounts().find(a => a.id === this.selectedAccountId());
            balance = account ? account.balance : 0;
        } else {
            balance = this.accounts().reduce((sum, a) => sum + a.balance, 0);
        }

        // 2. Calculate Income/Expenses (Account + Search + Month)
        let transactionsForStats = this.transactions();

        // Filter by Account
        if (this.selectedAccountId()) {
            transactionsForStats = transactionsForStats.filter(t =>
                t.account === this.selectedAccountId() ||
                (t.type === 'transfer' && t.toAccount === this.selectedAccountId())
            );
        }

        // Filter by Search
        const query = this.searchQuery().toLowerCase();
        if (query) {
            transactionsForStats = transactionsForStats.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.amount.toString().includes(query) ||
                this.getCategoryById(t.category)?.name.toLowerCase().includes(query)
            );
        }

        // Filter by Month
        const thisMonthTransactions = transactionsForStats.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const income = thisMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = thisMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { balance, income, expenses };
    }

    getFilteredTransactions() {
        let filtered = this.transactions();

        // Filter by Account
        if (this.selectedAccountId()) {
            filtered = filtered.filter(t =>
                t.account === this.selectedAccountId() ||
                (t.type === 'transfer' && t.toAccount === this.selectedAccountId())
            );
        }

        // Filter by Search
        const query = this.searchQuery().toLowerCase();
        if (query) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.amount.toString().includes(query) ||
                this.getCategoryById(t.category)?.name.toLowerCase().includes(query)
            );
        }
        return filtered;
    }

    getSortedTransactions() {
        let filtered = this.getFilteredTransactions();

        // Filter by Month
        const currentMonth = this.selectedMonth().getMonth();
        const currentYear = this.selectedMonth().getFullYear();

        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        return filtered.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }

    onMonthChange(date: Date) {
        this.selectedMonth.set(date);
    }

    getCategoryById(id: string): Category | undefined {
        return this.categories().find(c => c.id === id);
    }

    getAccountById(id: string): Account | undefined {
        return this.accounts().find(a => a.id === id);
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    getTotalBalance(): number {
        return this.accounts().reduce((sum, a) => sum + a.balance, 0);
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getTodayDateString(): string {
        return new Date().toISOString().split('T')[0];
    }

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        input.click();
    }

    triggerExport() {
        const transactions = this.transactions();
        if (transactions.length === 0) {
            alert('Keine Transaktionen zum Exportieren vorhanden.');
            return;
        }

        // Build CSV content
        // Format: ID, Amount, Date, Title, Empty, Account, Currency, Category
        const csvLines: string[] = [];

        transactions.forEach(t => {
            const account = this.getAccountById(t.account);
            const category = this.getCategoryById(t.category);
            const amount = t.type === 'expense' ? -t.amount : t.amount;

            const line = [
                t.id,
                amount.toFixed(2),
                t.date,
                t.description,
                '', // Empty field
                account?.name || '',
                'EUR',
                category?.name || ''
            ].join(',');

            csvLines.push(line);
        });

        const csvContent = csvLines.join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `budget_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private processImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            this.parseAndImportCSV(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportCSV(csv: string) {
        const lines = csv.split('\n');
        const newTransactions: Transaction[] = [];

        // Local maps for batch processing
        // Start with empty accounts to reset them (clean start)
        const accountsMap = new Map<string, Account>();
        // Start with existing categories to preserve icons/ids
        const categoriesMap = new Map<string, Category>();
        this.categories().forEach(c => categoriesMap.set(c.name, c));

        lines.forEach(line => {
            if (!line.trim()) return;

            const parts = line.split(',');
            if (parts.length < 8) return;

            const amountRaw = parseFloat(parts[1]);
            const dateRaw = parts[2].trim().replace(' ', 'T');
            const description = parts[3].trim();
            const accountName = parts[5].trim();
            const categoryName = parts[7].trim();

            // 1. Handle Account
            let account = accountsMap.get(accountName);
            if (!account) {
                account = {
                    id: this.generateId(),
                    name: accountName,
                    balance: 0
                };
                accountsMap.set(accountName, account);
            }

            // Update balance
            account.balance += amountRaw;

            // 2. Handle Category
            let category = categoriesMap.get(categoryName);
            if (!category) {
                category = {
                    id: this.generateId(),
                    name: categoryName,
                    type: 'both' // Default type for imported categories
                };
                categoriesMap.set(categoryName, category);
            }

            // 3. Create Transaction
            const amount = Math.abs(amountRaw);
            const type: 'income' | 'expense' = amountRaw >= 0 ? 'income' : 'expense';

            const transaction: Transaction = {
                id: this.generateId(),
                type,
                amount,
                description,
                category: category.id,
                account: account.id,
                date: dateRaw.split('T')[0]
            };

            newTransactions.push(transaction);
        });

        if (newTransactions.length > 0) {
            // Set signals with new data (replacing old for transactions/accounts)
            this.transactions.set(newTransactions);
            this.accounts.set(Array.from(accountsMap.values()));
            this.categories.set(Array.from(categoriesMap.values()));

            this.saveTransactions();
            this.saveAccounts();
            this.saveCategories();
        }
    }

    private updateAccountBalance(accountId: string, delta: number) {
        this.accounts.update(accounts =>
            accounts.map(a =>
                a.id === accountId ? { ...a, balance: a.balance + delta } : a
            )
        );
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private setTodayDate() {
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }, 0);
    }

    private saveTransactions() {
        localStorage.setItem('mybudget_transactions', JSON.stringify(this.transactions()));
    }

    private saveAccounts() {
        localStorage.setItem('mybudget_accounts', JSON.stringify(this.accounts()));
    }

    private saveCategories() {
        localStorage.setItem('mybudget_categories', JSON.stringify(this.categories()));
    }

    // Inline editing methods
    toggleInlineEdit(transactionId: string) {
        if (this.inlineEditingTransactionId() === transactionId) {
            this.inlineEditingTransactionId.set(null);
        } else {
            const transaction = this.transactions().find(t => t.id === transactionId);
            if (transaction) {
                this.inlineEditingTransactionId.set(transactionId);
                // Initialize the type for this transaction
                this.inlineTransactionTypes.update(map => {
                    const newMap = new Map(map);
                    newMap.set(transactionId, transaction.type);
                    return newMap;
                });
            }
        }
    }

    cancelInlineEdit(transactionId: string) {
        this.inlineEditingTransactionId.set(null);
        this.inlineTransactionTypes.update(map => {
            const newMap = new Map(map);
            newMap.delete(transactionId);
            return newMap;
        });
    }

    isEditingInline(transactionId: string): boolean {
        return this.inlineEditingTransactionId() === transactionId;
    }

    setInlineTransactionType(transactionId: string, type: 'income' | 'expense' | 'transfer') {
        this.inlineTransactionTypes.update(map => {
            const newMap = new Map(map);
            newMap.set(transactionId, type);
            return newMap;
        });
    }

    getInlineTransactionType(transactionId: string): 'income' | 'expense' | 'transfer' {
        const transaction = this.transactions().find(t => t.id === transactionId);
        return this.inlineTransactionTypes().get(transactionId) || transaction?.type || 'expense';
    }

    onInlineTransactionEdit(event: Event, transactionId: string) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const type = this.getInlineTransactionType(transactionId);
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string;
        const categoryId = formData.get('category') as string;
        const accountId = formData.get('account') as string;
        const toAccountId = formData.get('toAccount') as string;
        const date = formData.get('date') as string;

        // Validate: Transfer requires toAccount
        if (type === 'transfer' && !toAccountId) {
            alert('Bei einem Transfer muss ein Zielkonto angegeben werden.');
            return;
        }

        const oldTransaction = this.transactions().find(t => t.id === transactionId);
        if (!oldTransaction) return;

        const updatedTransaction: Transaction = {
            id: transactionId,
            type,
            amount,
            description,
            category: categoryId,
            account: accountId,
            toAccount: type === 'transfer' ? toAccountId : undefined,
            date
        };

        // Revert old transaction balance and apply new one
        this.revertTransactionBalance(oldTransaction);
        this.applyTransactionBalance(updatedTransaction);

        // Update the transaction
        this.transactions.update(t => t.map(item => item.id === transactionId ? updatedTransaction : item));

        this.saveTransactions();
        this.saveAccounts();

        // Exit edit mode
        this.cancelInlineEdit(transactionId);
    }

    viewMode = signal<'transactions' | 'statistics'>('transactions');

    toggleViewMode(mode: 'transactions' | 'statistics') {
        this.viewMode.set(mode);
    }

    getCategoryStats() {
        const transactions = this.getSortedTransactions().filter(t => t.type === 'expense');
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        const stats = new Map<string, number>();
        transactions.forEach(t => {
            const current = stats.get(t.category) || 0;
            stats.set(t.category, current + t.amount);
        });

        return Array.from(stats.entries())
            .map(([id, amount]) => ({
                name: this.getCategoryById(id)?.name || 'Unbekannt',
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: this.getCategoryColor(id)
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    getDailyTrend() {
        const transactions = this.getSortedTransactions();
        const daysInMonth = new Date(this.selectedMonth().getFullYear(), this.selectedMonth().getMonth() + 1, 0).getDate();
        const dailyBalances: { day: number, balance: number, income: number, expense: number }[] = [];

        let currentBalance = 0;
        const transactionsByDay = new Map<number, Transaction[]>();

        transactions.forEach(t => {
            const day = new Date(t.date).getDate();
            const list = transactionsByDay.get(day) || [];
            list.push(t);
            transactionsByDay.set(day, list);
        });

        for (let i = 1; i <= daysInMonth; i++) {
            const dayTransactions = transactionsByDay.get(i) || [];
            let dayIncome = 0;
            let dayExpense = 0;

            dayTransactions.forEach(t => {
                if (t.type === 'income') {
                    dayIncome += t.amount;
                    currentBalance += t.amount;
                } else if (t.type === 'expense') {
                    dayExpense += t.amount;
                    currentBalance -= t.amount;
                } else if (t.type === 'transfer' && t.toAccount) {
                    if (this.selectedAccountId()) {
                        if (t.account === this.selectedAccountId()) {
                            currentBalance -= t.amount;
                        } else if (t.toAccount === this.selectedAccountId()) {
                            currentBalance += t.amount;
                        }
                    }
                }
            });

            dailyBalances.push({
                day: i,
                balance: currentBalance,
                income: dayIncome,
                expense: dayExpense
            });
        }

        return dailyBalances;
    }

    private getCategoryColor(id: string): string {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 50%)`;
    }

    getPieChartGradient(): string {
        const stats = this.getCategoryStats();
        if (stats.length === 0) return 'conic-gradient(#333 0% 100%)';

        let gradient = 'conic-gradient(';
        let currentPercent = 0;

        stats.forEach((stat, index) => {
            const nextPercent = currentPercent + stat.percentage;
            gradient += `${stat.color} ${currentPercent}% ${nextPercent}%${index < stats.length - 1 ? ', ' : ''}`;
            currentPercent = nextPercent;
        });

        gradient += ')';
        return gradient;
    }

    getTrendPoints(): string {
        const data = this.getDailyTrend();
        if (data.length === 0) return '';

        const maxBalance = Math.max(...data.map(d => d.balance), 100); // Avoid div by 0
        const minBalance = Math.min(...data.map(d => d.balance), 0);
        const range = maxBalance - minBalance || 1; // Avoid div by 0

        const width = 100;
        const height = 50;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const normalizedBalance = (d.balance - minBalance) / range;
            const y = height - (normalizedBalance * height);
            return `${x},${y}`;
        }).join(' ');

        return points;
    }
}
