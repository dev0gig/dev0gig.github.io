import { BudgetStateService } from './budget.state.service';
import { Transaction } from './budget.models';

/**
 * Budget Page Import/Export Handlers - Manages file import and export operations (CSV format)
 */
export class BudgetPageImportExportHandlers {

    constructor(
        private stateService: BudgetStateService
    ) { }

    // ==================== CSV Helpers ====================

    private escapeCSVField(field: string | undefined | null): string {
        if (field === undefined || field === null) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    private parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
        }
        result.push(current);
        return result;
    }

    // ==================== Import ====================

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

    private processImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            this.parseAndImportCSV(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportCSV(csvContent: string) {
        try {
            const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

            if (lines.length < 2) {
                alert('CSV-Datei enthält keine Daten.');
                return;
            }

            const header = this.parseCSVLine(lines[0]);
            const expectedHeaders = ['id', 'type', 'amount', 'description', 'category', 'account', 'toAccount', 'date', 'isFixedCost', 'note'];

            // Check if header matches expected format
            const headerLower = header.map(h => h.toLowerCase().trim());
            const hasValidHeader = expectedHeaders.every((h, i) => headerLower[i] === h.toLowerCase());

            if (!hasValidHeader) {
                alert('Ungültiges CSV-Format. Erwartete Spalten: ' + expectedHeaders.join(', '));
                return;
            }

            const transactions: Transaction[] = [];

            for (let i = 1; i < lines.length; i++) {
                const fields = this.parseCSVLine(lines[i]);
                if (fields.length < 8) continue;

                const transaction: Transaction = {
                    id: fields[0] || crypto.randomUUID(),
                    type: (fields[1] as 'income' | 'expense' | 'transfer') || 'expense',
                    amount: parseFloat(fields[2]) || 0,
                    description: fields[3] || '',
                    category: fields[4] || '',
                    account: fields[5] || '',
                    toAccount: fields[6] || undefined,
                    date: fields[7] || new Date().toISOString().split('T')[0],
                    isFixedCost: fields[8]?.toLowerCase() === 'true',
                    note: fields[9] || undefined
                };

                if (transaction.type && ['income', 'expense', 'transfer'].includes(transaction.type)) {
                    transactions.push(transaction);
                }
            }

            if (transactions.length > 0) {
                this.stateService.importTransactionsFromCSV(transactions);
                alert(`${transactions.length} Transaktionen erfolgreich importiert.`);
            } else {
                alert('Keine gültigen Transaktionen in der CSV-Datei gefunden.');
            }
        } catch (error) {
            console.error('CSV Import Error:', error);
            alert('Fehler beim Parsen der CSV-Datei. Bitte überprüfen Sie das Format.');
        }
    }

    // ==================== Export ====================

    triggerExport() {
        const transactions = this.stateService.transactions();

        if (transactions.length === 0) {
            alert('Keine Transaktionen zum Exportieren vorhanden.');
            return;
        }

        const headers = ['id', 'type', 'amount', 'description', 'category', 'account', 'toAccount', 'date', 'isFixedCost', 'note'];
        const csvLines: string[] = [headers.join(',')];

        for (const t of transactions) {
            const row = [
                this.escapeCSVField(t.id),
                this.escapeCSVField(t.type),
                String(t.amount),
                this.escapeCSVField(t.description),
                this.escapeCSVField(t.category),
                this.escapeCSVField(t.account),
                this.escapeCSVField(t.toAccount),
                this.escapeCSVField(t.date),
                t.isFixedCost ? 'true' : 'false',
                this.escapeCSVField(t.note)
            ];
            csvLines.push(row.join(','));
        }

        const csvContent = csvLines.join('\n');
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
}
