import JSZip from 'jszip';
import { JournalEntry } from '../types';
import { useJournal } from './useJournal';
import { useAuriMeaData } from './useAuriMeaData';
import { useUIState } from './useUIState';

type DataHooks = {
    journal: ReturnType<typeof useJournal>;
    auriMea: ReturnType<typeof useAuriMeaData>;
};

type UIHook = ReturnType<typeof useUIState>;

interface UseDataManagerProps {
    data: DataHooks;
    ui: UIHook;
    setIsDeleteModalOpen: (isOpen: boolean) => void;
}

export const useDataManager = ({ data, ui, setIsDeleteModalOpen }: UseDataManagerProps) => {
    
    const handleDeleteAppData = (scope: 'all' | 'memo' | 'auri') => {
        const confirmationMessage: Record<typeof scope, string> = {
            all: "Möchten Sie wirklich ALLE Anwendungsdaten (MemoMea, AuriMea) unwiderruflich löschen?",
            memo: "Möchten Sie wirklich ALLE MemoMea-Einträge löschen?",
            auri: "Möchten Sie wirklich ALLE AuriMea-Daten (Konten, Transaktionen etc.) löschen?",
        };
        
        ui.showConfirmation(
          "Bestätigen Sie die Löschung",
          confirmationMessage[scope],
          () => {
            if (scope === 'all' || scope === 'memo') data.journal.setJournalEntries([]);
            if (scope === 'all' || scope === 'auri') data.auriMea.resetAuriMeaData();
            
            setIsDeleteModalOpen(false);
            ui.showNotification("Erfolg", "Die ausgewählten Daten wurden gelöscht.", 'success');
          }
        );
    };

    const createDownload = (dataToExport: any, fileName: string) => {
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        ui.setBackupModalState({ isOpen: false, mode: 'export' });
    };

    const handleExportData = async () => {
        const scope = 'all';
        const fileName = `axismea_backup_${scope}_${new Date().toISOString().split('T')[0]}.json`;
        
        const moduleData = {
            memo: data.journal.journalEntries,
            auri: {
                accounts: data.auriMea.accounts,
                transactions: data.auriMea.transactions,
                categories: data.auriMea.categories,
                templates: data.auriMea.templates,
                activeAccountId: data.auriMea.activeAccountId,
            },
        };
        
        const dataToExport = {
            backupType: scope,
            version: 1,
            data: moduleData,
        };
        
        createDownload(dataToExport, fileName);
    };
    
    const handleExportMemoMeaAsMarkdown = async () => {
        const zip = new JSZip();
        const entriesByDate = new Map<string, JournalEntry[]>();

        data.journal.journalEntries.forEach(entry => {
            const dateStr = new Date(entry.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
            if (!entriesByDate.has(dateStr)) {
                entriesByDate.set(dateStr, []);
            }
            entriesByDate.get(dateStr)!.push(entry);
        });

        entriesByDate.forEach((entries, dateStr) => {
            entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const content = entries.map(e => e.content).join('\n\n---\n\n');
            zip.file(`${dateStr}.md`, content);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `memomea_backup_markdown_${new Date().toISOString().split('T')[0]}.zip`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        ui.setBackupModalState({ isOpen: false, mode: 'export' });
    };

  
    const handleImportData = (file: File) => {
        const reader = new FileReader();

        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result;
                    if (!(content instanceof ArrayBuffer)) throw new Error("File could not be read as ArrayBuffer");
                    
                    const JSZip = (await import('jszip')).default;
                    const zip = await JSZip.loadAsync(content);
                    const newEntries: JournalEntry[] = [];
                    const filePromises: Promise<void>[] = [];

                    zip.forEach((relativePath, zipEntry) => {
                        if (!zipEntry.dir && relativePath.endsWith('.md')) {
                            const promise = zipEntry.async("string").then(fileContent => {
                                const dateMatch = relativePath.match(/^(\d{4})-(\d{2})-(\d{2})/);
                                if (dateMatch) {
                                    const [, year, month, day] = dateMatch;
                                    const createdAt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0)).toISOString();
                                    
                                    const newEntry: JournalEntry = {
                                        id: `memo-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                        content: fileContent,
                                        createdAt: createdAt,
                                    };
                                    newEntries.push(newEntry);
                                }
                            });
                            filePromises.push(promise);
                        }
                    });

                    await Promise.all(filePromises);

                    if (newEntries.length > 0) {
                        data.journal.setJournalEntries(prev => 
                            [...prev, ...newEntries]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        );
                        ui.showNotification('Erfolg', `${newEntries.length} MemoMea-Einträge erfolgreich importiert.`, 'success');
                    } else {
                        throw new Error("ZIP-Datei enthält keine gültigen .md Dateien.");
                    }
                } catch (error) {
                    console.error("ZIP Import failed:", error);
                    ui.showNotification('Fehler', 'Die ZIP-Datei ist ungültig oder konnte nicht verarbeitet werden.', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
            ui.setBackupModalState({ isOpen: false, mode: 'import' });
            return;
        }
        
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read");
            const parsedData = JSON.parse(text);

            if (!parsedData.backupType || parsedData.data === undefined) {
                 throw new Error("Invalid backup file structure. Missing 'backupType' or 'data' properties.");
            }

            const importData = parsedData.data;
            const backupType = parsedData.backupType;
            let needsReload = false;

            switch(backupType) {
                case 'all':
                    if (importData.memo) data.journal.setJournalEntries(importData.memo);
                    if (importData.auri) data.auriMea.importAuriMeaData(importData.auri);
                    break;
                case 'memo': data.journal.setJournalEntries(importData); break;
                case 'auri': data.auriMea.importAuriMeaData(importData); break;
                default:
                    throw new Error(`Unrecognized backup type: ${backupType}`);
            }

            ui.showNotification('Erfolg', 'Daten erfolgreich importiert.', 'success');
            if (needsReload) {
                setTimeout(() => window.location.reload(), 1500);
            }

          } catch (error: any) {
            console.error("Import failed:", error);
            ui.showNotification('Fehler', `Import fehlgeschlagen: ${error.message}`, 'error');
          }
        };
        reader.readAsText(file);
        ui.setBackupModalState({ isOpen: false, mode: 'import' });
    };
    
    return {
        handleDeleteAppData,
        handleExportData,
        handleImportData,
        handleExportMemoMeaAsMarkdown,
    };
};