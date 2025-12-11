import { Injectable, inject } from '@angular/core';
import { FixedCost, FixedCostGroup, Account, Category } from './budget.models';
import { BudgetStateService } from './budget.state.service';
import { BudgetUtilityService } from './budget.utility.service';

@Injectable({
    providedIn: 'root'
})
export class BudgetPdfService {
    private stateService = inject(BudgetStateService);
    private utilityService = inject(BudgetUtilityService);

    /**
     * Generates and downloads a PDF of fixed costs with groups
     */
    exportFixedCostsPdf(): void {
        const fixedCosts = this.stateService.getFixedCostsSortedByOrder();
        const groups = this.stateService.getFixedCostGroupsSortedByOrder();
        const accounts = this.stateService.accounts();
        const categories = this.stateService.categories();

        // Calculate totals
        const income = this.stateService.getFixedIncomeTotal();
        const expenses = this.stateService.getFixedCostsTotal();
        const transfers = this.stateService.getFixedTransferTotal();
        const net = income - expenses;

        // Generate HTML content for PDF
        const htmlContent = this.generatePdfHtml(
            fixedCosts, groups, accounts, categories,
            income, expenses, transfers, net
        );

        // Open print dialog which allows saving as PDF
        this.printHtml(htmlContent);
    }

    private generatePdfHtml(
        fixedCosts: FixedCost[],
        groups: FixedCostGroup[],
        accounts: Account[],
        categories: Category[],
        income: number,
        expenses: number,
        transfers: number,
        net: number
    ): string {
        const date = new Date().toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const getAccountName = (id: string | undefined): string => {
            if (!id) return '-';
            return accounts.find(a => a.id === id)?.name || '-';
        };

        const getCategoryName = (id: string): string => {
            return this.stateService.getCategoryFullName(id);
        };

        const formatCurrency = (amount: number): string => {
            return this.utilityService.formatCurrency(amount);
        };

        const getTypeSymbol = (type: 'income' | 'expense' | 'transfer'): string => {
            switch (type) {
                case 'income': return '+';
                case 'expense': return '-';
                case 'transfer': return '↔';
            }
        };

        const getTypeColor = (type: 'income' | 'expense' | 'transfer'): string => {
            switch (type) {
                case 'income': return '#22c55e';
                case 'expense': return '#ef4444';
                case 'transfer': return '#a855f7';
            }
        };

        // Get ungrouped fixed costs (not excluded)
        const ungrouped = fixedCosts.filter(fc => !fc.groupId && !fc.excludeFromTotal);
        const excluded = fixedCosts.filter(fc => fc.excludeFromTotal);

        // Group fixed costs by group
        const fixedCostsByGroup = new Map<string, FixedCost[]>();
        groups.forEach(g => {
            fixedCostsByGroup.set(g.id, fixedCosts.filter(fc => fc.groupId === g.id && !fc.excludeFromTotal));
        });

        // Generate fixed cost rows
        const generateRows = (costs: FixedCost[], isExcluded = false): string => {
            return costs.map(fc => `
                <tr class="cost-row${isExcluded ? ' excluded' : ''}">
                    <td class="type-cell">
                        <span class="type-badge" style="background: ${getTypeColor(fc.type)}15; color: ${getTypeColor(fc.type)}">
                            ${getTypeSymbol(fc.type)}
                        </span>
                    </td>
                    <td class="name-cell">
                        <div class="name">${fc.name}</div>
                        ${fc.note ? `<div class="note">${fc.note}</div>` : ''}
                    </td>
                    <td class="category-cell">${fc.type === 'transfer' ? `${getAccountName(fc.account)} → ${getAccountName(fc.toAccount)}` : getCategoryName(fc.category)}</td>
                    <td class="account-cell">${fc.type !== 'transfer' ? getAccountName(fc.account) : '-'}</td>
                    <td class="amount-cell" style="color: ${getTypeColor(fc.type)}">
                        ${fc.type === 'income' ? '+' : fc.type === 'expense' ? '-' : ''}${formatCurrency(fc.amount)}
                    </td>
                </tr>
            `).join('');
        };

        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Fixkosten Übersicht</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 10pt;
            color: #1f2937;
            line-height: 1.4;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #6366f1;
        }
        
        .header h1 {
            font-size: 20pt;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .header .subtitle {
            color: #6b7280;
            font-size: 9pt;
        }
        
        .header .date {
            text-align: right;
            color: #6b7280;
            font-size: 9pt;
        }
        
        /* Summary Cards */
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }
        
        .summary-card {
            padding: 12px;
            border-radius: 6px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
        }
        
        .summary-card .label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .summary-card .value {
            font-size: 14pt;
            font-weight: 700;
        }
        
        .summary-card.income .value { color: #22c55e; }
        .summary-card.expense .value { color: #ef4444; }
        .summary-card.transfer .value { color: #a855f7; }
        .summary-card.net .value { color: ${net >= 0 ? '#22c55e' : '#ef4444'}; }
        
        /* Groups */
        .group {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .group-header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 10px 14px;
            border-radius: 6px 6px 0 0;
            font-weight: 600;
            font-size: 11pt;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .group-header.ungrouped {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }
        
        .group-header.excluded {
            background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%);
        }
        
        .group-header .count {
            font-weight: 400;
            font-size: 9pt;
            opacity: 0.85;
        }
        
        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 6px 6px;
            overflow: hidden;
        }
        
        th {
            background: #f3f4f6;
            padding: 8px 10px;
            text-align: left;
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
        }
        
        td {
            padding: 10px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .type-cell {
            width: 40px;
            text-align: center;
        }
        
        .type-badge {
            display: inline-block;
            width: 24px;
            height: 24px;
            line-height: 24px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 12pt;
            text-align: center;
        }
        
        .name-cell {
            min-width: 150px;
        }
        
        .name-cell .name {
            font-weight: 600;
            color: #1f2937;
        }
        
        .name-cell .note {
            font-size: 8pt;
            color: #6b7280;
            margin-top: 2px;
            font-style: italic;
        }
        
        .category-cell {
            color: #4b5563;
            font-size: 9pt;
        }
        
        .account-cell {
            color: #4b5563;
            font-size: 9pt;
        }
        
        .amount-cell {
            text-align: right;
            font-weight: 700;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10pt;
            white-space: nowrap;
        }
        
        .cost-row.excluded {
            opacity: 0.6;
        }
        
        /* Group subtotal */
        .group-subtotal {
            background: #f9fafb;
            font-weight: 600;
        }
        
        .group-subtotal td {
            padding: 10px;
            border-top: 2px solid #e5e7eb;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 8pt;
            color: #9ca3af;
            text-align: center;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>📋 Fixkosten Übersicht</h1>
            <div class="subtitle">Monatliche feste Einnahmen und Ausgaben</div>
        </div>
        <div class="date">
            Erstellt am ${date}
        </div>
    </div>
    
    <div class="summary">
        <div class="summary-card income">
            <div class="label">Einnahmen</div>
            <div class="value">+${formatCurrency(income)}</div>
        </div>
        <div class="summary-card expense">
            <div class="label">Ausgaben</div>
            <div class="value">-${formatCurrency(expenses)}</div>
        </div>
        <div class="summary-card transfer">
            <div class="label">Transfers</div>
            <div class="value">${formatCurrency(transfers)}</div>
        </div>
        <div class="summary-card net">
            <div class="label">Netto</div>
            <div class="value">${net >= 0 ? '+' : ''}${formatCurrency(net)}</div>
        </div>
    </div>
    
    ${ungrouped.length > 0 ? `
    <div class="group">
        <div class="group-header ungrouped">
            <span>Ohne Gruppe</span>
            <span class="count">${ungrouped.length} Einträge</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Kategorie</th>
                    <th>Konto</th>
                    <th style="text-align: right">Betrag</th>
                </tr>
            </thead>
            <tbody>
                ${generateRows(ungrouped)}
                <tr class="group-subtotal">
                    <td colspan="4">Summe</td>
                    <td class="amount-cell">${formatCurrency(ungrouped.reduce((sum, fc) => {
            if (fc.type === 'income') return sum + fc.amount;
            if (fc.type === 'expense') return sum - fc.amount;
            return sum;
        }, 0))}</td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}
    
    ${groups.map(group => {
            const groupCosts = fixedCostsByGroup.get(group.id) || [];
            if (groupCosts.length === 0) return '';

            const groupTotal = groupCosts.reduce((sum, fc) => {
                if (fc.type === 'income') return sum + fc.amount;
                if (fc.type === 'expense') return sum - fc.amount;
                return sum;
            }, 0);

            return `
        <div class="group">
            <div class="group-header">
                <span>📁 ${group.name}</span>
                <span class="count">${groupCosts.length} Einträge</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Kategorie</th>
                        <th>Konto</th>
                        <th style="text-align: right">Betrag</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateRows(groupCosts)}
                    <tr class="group-subtotal">
                        <td colspan="4">Summe ${group.name}</td>
                        <td class="amount-cell" style="color: ${groupTotal >= 0 ? '#22c55e' : '#ef4444'}">${groupTotal >= 0 ? '+' : ''}${formatCurrency(Math.abs(groupTotal))}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
        }).join('')}
    
    ${excluded.length > 0 ? `
    <div class="group">
        <div class="group-header excluded">
            <span>⚠️ Nicht in Summe enthalten</span>
            <span class="count">${excluded.length} Einträge</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Kategorie</th>
                    <th>Konto</th>
                    <th style="text-align: right">Betrag</th>
                </tr>
            </thead>
            <tbody>
                ${generateRows(excluded, true)}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        Budget App • Fixkosten Export • ${date}
    </div>
</body>
</html>
        `;

        return html;
    }

    private printHtml(html: string): void {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.');
            return;
        }

        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for styles to load, then trigger print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
    }
}
