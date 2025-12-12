import { BudgetStateService } from './budget.state.service';

/**
 * Budget Page Import/Export Handlers - Manages file import and export operations
 */
export class BudgetPageImportExportHandlers {

    constructor(
        private stateService: BudgetStateService
    ) { }

    // ==================== Import ====================

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
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
            this.parseAndImportJSON(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportJSON(jsonString: string) {
        let jsonData: any;
        try {
            jsonData = JSON.parse(jsonString);
        } catch (error) {
            alert('Fehler beim Parsen der JSON-Datei. Bitte überprüfen Sie das Format.');
            return;
        }

        if (jsonData.version === 2 && jsonData.transaktionen) {
            const result = this.stateService.importExtendedFormat(jsonData);
            alert(`Import erfolgreich:\n- ${result.transactions} Transaktionen\n- ${result.fixedCosts} Fixkosten`);
        } else if (Array.isArray(jsonData)) {
            const count = this.stateService.importLegacyFormat(jsonData);
            if (count > 0) {
                alert(`${count} Transaktionen erfolgreich importiert.`);
            } else {
                alert('Keine gültigen Transaktionen in der Datei gefunden.');
            }
        } else {
            alert('Unbekanntes Dateiformat. Bitte überprüfen Sie die JSON-Datei.');
        }
    }

    // ==================== Export ====================

    triggerExport() {
        const transactions = this.stateService.transactions();
        const fixedCosts = this.stateService.fixedCosts();

        if (transactions.length === 0 && fixedCosts.length === 0) {
            alert('Keine Daten zum Exportieren vorhanden.');
            return;
        }

        const exportData = this.stateService.getExportData();
        const jsonContent = JSON.stringify(exportData, null, 2);

        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `budget_export_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
