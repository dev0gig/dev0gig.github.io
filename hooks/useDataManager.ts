import { JournalEntry } from '../types';
import { useApps } from './useApps';
import { useJournal } from './useJournal';
import { useBookmarks } from './useBookmarks';
import { useCollections } from './useCollections';
import { useAuriMeaData } from './useAuriMeaData';
import { useUIState } from './useUIState';

type DataHooks = {
    apps: ReturnType<typeof useApps>;
    journal: ReturnType<typeof useJournal>;
    bookmarks: ReturnType<typeof useBookmarks>;
    collections: ReturnType<typeof useCollections>;
    auriMea: ReturnType<typeof useAuriMeaData>;
};

type UIHook = ReturnType<typeof useUIState>;

interface UseDataManagerProps {
    data: DataHooks;
    ui: UIHook;
    setIsDeleteModalOpen: (isOpen: boolean) => void;
}

export const useDataManager = ({ data, ui, setIsDeleteModalOpen }: UseDataManagerProps) => {
    
    const handleDeleteAppData = (scope: 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri' | 'fwdaten') => {
        const confirmationMessage: Record<typeof scope, string> = {
            all: "Möchten Sie wirklich ALLE Anwendungsdaten (Apps, MemoMea, ReadLateR, CollMea, AuriMea, FW-Daten) unwiderruflich löschen?",
            apps: "Möchten Sie wirklich ALLE Apps löschen?",
            memo: "Möchten Sie wirklich ALLE MemoMea-Einträge löschen?",
            read: "Möchten Sie wirklich ALLE ReadLateR-Lesezeichen löschen?",
            coll: "Möchten Sie wirklich ALLE CollMea-Sammlungen löschen?",
            auri: "Möchten Sie wirklich ALLE AuriMea-Daten (Konten, Transaktionen etc.) löschen?",
            fwdaten: "Möchten Sie wirklich ALLE FW-Daten (Zähler, Zählerstände) unwiderruflich löschen?",
        };
        
        ui.showConfirmation(
          "Bestätigen Sie die Löschung",
          confirmationMessage[scope],
          () => {
            if (scope === 'all' || scope === 'apps') data.apps.setApps([]);
            if (scope === 'all' || scope === 'memo') data.journal.setJournalEntries([]);
            if (scope === 'all' || scope === 'read') data.bookmarks.setBookmarks([]);
            if (scope === 'all' || scope === 'coll') data.collections.setCollections([]);
            if (scope === 'all' || scope === 'auri') data.auriMea.resetAuriMeaData();
            if (scope === 'all' || scope === 'fwdaten') {
                localStorage.removeItem('fw-data-meters');
                localStorage.removeItem('fw-data-readings');
                localStorage.removeItem('fw-data-meter-draft');
                localStorage.removeItem('fw-data-reading-drafts');
            }
            
            setIsDeleteModalOpen(false);
            ui.showNotification("Erfolg", "Die ausgewählten Daten wurden gelöscht.", 'success');
          }
        );
    };

    const handleExportData = async (scope: 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri' | 'memomd' | 'fwdaten') => {
        let dataToExport: any;
        let fileName = `axismea_backup_${scope}.json`;

        if (scope === 'memomd') {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const filenames = new Map<string, number>();

            data.journal.journalEntries.forEach(entry => {
                const date = new Date(entry.createdAt);
                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                
                const count = filenames.get(dateString) || 0;
                const finalFilename = count > 0 ? `${dateString}-${count + 1}.md` : `${dateString}.md`;
                
                filenames.set(dateString, count + 1);

                zip.file(finalFilename, entry.content);
            });

            const blob = await zip.generateAsync({ type: "blob" });
            const zipFileName = `axismea_backup_memomea_markdown_${new Date().toISOString().split('T')[0]}.zip`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = zipFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            ui.setBackupModalState({ isOpen: false, mode: 'export', scope: null });
            return;
        }

        switch(scope) {
            case 'all':
                dataToExport = {
                    apps: data.apps.apps,
                    journalEntries: data.journal.journalEntries,
                    bookmarks: data.bookmarks.bookmarks,
                    collections: data.collections.collections,
                    auriMea: {
                        accounts: data.auriMea.accounts,
                        transactions: data.auriMea.transactions,
                        categories: data.auriMea.categories,
                        templates: data.auriMea.templates,
                    },
                    fwDaten: {
                        meters: JSON.parse(localStorage.getItem('fw-data-meters') || '[]'),
                        readings: JSON.parse(localStorage.getItem('fw-data-readings') || '[]'),
                    }
                };
                fileName = `axismea_backup_all_${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'apps': dataToExport = data.apps.apps; break;
            case 'memo': dataToExport = data.journal.journalEntries; break;
            case 'read': dataToExport = data.bookmarks.bookmarks; break;
            case 'coll': dataToExport = data.collections.collections; break;
            case 'auri':
                dataToExport = {
                    accounts: data.auriMea.accounts,
                    transactions: data.auriMea.transactions,
                    categories: data.auriMea.categories,
                    templates: data.auriMea.templates,
                };
                fileName = `axismea_backup_auri_${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'fwdaten':
                dataToExport = {
                    meters: JSON.parse(localStorage.getItem('fw-data-meters') || '[]'),
                    readings: JSON.parse(localStorage.getItem('fw-data-readings') || '[]'),
                };
                fileName = `axismea_backup_fwdaten_${new Date().toISOString().split('T')[0]}.json`;
                break;
        }
        
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
        ui.setBackupModalState({ isOpen: false, mode: 'export', scope: null });
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
            ui.setBackupModalState({ isOpen: false, mode: 'import', scope: null });
            return; // Exit to prevent JSON logic from running
        }
        
        // Default JSON import logic
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read");
            const parsedData = JSON.parse(text);

            let importedSomething = false;

            // Check for AuriMea standalone backup
            if (parsedData.accounts && parsedData.transactions && parsedData.categories && parsedData.templates && !parsedData.apps) {
                data.auriMea.importAuriMeaData(parsedData);
                ui.showNotification('Erfolg', 'AuriMea-Daten erfolgreich importiert.', 'success');
                importedSomething = true;
            } 
            // Check for FW-Daten standalone backup
            else if (parsedData.meters && parsedData.readings && !parsedData.apps) {
                localStorage.setItem('fw-data-meters', JSON.stringify(parsedData.meters));
                localStorage.setItem('fw-data-readings', JSON.stringify(parsedData.readings));
                ui.showNotification('Erfolg', 'FW-Daten erfolgreich importiert.', 'success');
                importedSomething = true;
            }
            // Check for Main App (including full backup)
            else if (parsedData.apps && parsedData.journalEntries && parsedData.bookmarks && parsedData.collections) {
                data.apps.setApps(parsedData.apps);
                data.journal.setJournalEntries(parsedData.journalEntries);
                data.bookmarks.setBookmarks(parsedData.bookmarks);
                data.collections.setCollections(parsedData.collections);
                
                // If it's a full backup, also import AuriMea data
                if(parsedData.auriMea) {
                    data.auriMea.importAuriMeaData(parsedData.auriMea);
                }

                if(parsedData.fwDaten) {
                    localStorage.setItem('fw-data-meters', JSON.stringify(parsedData.fwDaten.meters));
                    localStorage.setItem('fw-data-readings', JSON.stringify(parsedData.fwDaten.readings));
                }
                
                ui.showNotification('Erfolg', 'Daten erfolgreich importiert.', 'success');
                importedSomething = true;
            }
            
            if (!importedSomething) {
                throw new Error("Invalid backup file structure.");
            }

          } catch (error) {
            console.error("Import failed:", error);
            ui.showNotification('Fehler', 'Die Importdatei ist ungültig oder beschädigt.', 'error');
          }
        };
        reader.readAsText(file);
        ui.setBackupModalState({ isOpen: false, mode: 'import', scope: null });
    };
    
    return {
        handleDeleteAppData,
        handleExportData,
        handleImportData,
    };
};
