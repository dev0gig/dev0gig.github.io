
import React, { useState, useEffect, useMemo } from 'react';
import { View, MyProject, AppItem, Tile, Collection, JournalEntry } from './types';

// Components
import ContextMenu from './components/ContextMenu';
import AppsView from './components/AppsView';
import AppFormModal from './components/AppFormModal';
import MemoMeaView from './components/MemoMeaView';
import ReadLateRView from './components/ReadLateRView';
import BookmarkFormModal from './components/BookmarkFormModal';
import BackupModal from './components/BackupModal';
import CollMeaView from './components/CollMeaView';
import CollectionFormModal from './components/CollectionFormModal';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import NotificationModal from './components/NotificationModal';
import SettingsModal from './components/SettingsModal';
import DeleteDataModal from './components/DeleteDataModal';
import AuriMeaApp from './components/AuriMea';
import PlaceholderView from './components/PlaceholderView';

// Hooks
import { useMediaQuery } from './hooks/useMediaQuery';
import { useApps } from './hooks/useApps';
import { useJournal } from './hooks/useJournal';
import { useBookmarks } from './hooks/useBookmarks';
import { useCollections } from './hooks/useCollections';
import { useTiles } from './hooks/useTiles';
import { useUIState } from './hooks/useUIState';
import { useNavigation } from './hooks/useNavigation';
import { useHistoryStack } from './hooks/useHistoryStack';
import { useAuriMeaData } from './hooks/useAuriMeaData';


const MY_PROJECT_DEFINITIONS: Record<MyProject, { label: string; icon: string }> = {
  [MyProject.MemoMea]: { label: 'MemoMea', icon: 'edit_note' },
  [MyProject.ReadLateR]: { label: 'ReadLateR', icon: 'bookmark' },
  [MyProject.CollMea]: { label: 'CollMea', icon: 'collections_bookmark' },
  [MyProject.AuriMea]: { label: 'AuriMea', icon: 'monitoring' },
  [MyProject.FWDaten]: { label: 'FW-Daten', icon: 'ssid_chart' },
  [MyProject.Flashcards]: { label: 'Flashcards', icon: 'style' },
};

const App: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Custom Hooks for State Management ---
  const data = {
      apps: useApps(),
      journal: useJournal(),
      bookmarks: useBookmarks(),
      collections: useCollections(),
      tiles: useTiles(),
      auriMea: useAuriMeaData(),
  };
  const ui = useUIState();
  const nav = useNavigation();
  
  // --- History / Back Button Management ---
  const isOverlayVisible =
    ui.notification.isOpen ||
    ui.isAppContextMenuOpen ||
    ui.appFormModal.isOpen ||
    ui.isBookmarkModalOpen ||
    ui.collectionFormModal.isOpen ||
    ui.backupModalState.isOpen ||
    isSettingsModalOpen ||
    isDeleteModalOpen ||
    !!nav.activeMobileContent ||
    (isDesktop && (!!nav.activeCollectionId || !!nav.activeMyProject));
  
  const closeTopOverlay = () => {
      if (ui.notification.isOpen) ui.closeNotification();
      else if (ui.isAppContextMenuOpen) ui.closeAllPopups();
      else if (ui.appFormModal.isOpen) ui.setAppFormModal({ isOpen: false, mode: 'add' });
      else if (ui.isBookmarkModalOpen) ui.setIsBookmarkModalOpen(false);
      else if (ui.collectionFormModal.isOpen) ui.setCollectionFormModal({ isOpen: false, mode: 'add' });
      else if (ui.backupModalState.isOpen) ui.setBackupModalState({ isOpen: false, mode: 'export', scope: null });
      else if (isSettingsModalOpen) setIsSettingsModalOpen(false);
      else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      else if (nav.activeMobileContent) nav.handleCloseMobileContent();
      else if (isDesktop) {
          if (nav.activeCollectionId) {
              nav.setActiveCollectionId(null);
          } else if (nav.activeMyProject) {
              nav.handleMyProjectSelect(null);
          }
      }
  };

  useHistoryStack({ isOverlayVisible, closeTopOverlay });

  // --- Search and Tag State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  
  // Reset search when view changes
  useEffect(() => {
    setSearchQuery('');
    setSuggestedTags([]);
  }, [nav.activeView, nav.activeMyProject, nav.activeCollectionId, data.bookmarks.readLaterShowArchived]);

  // --- Data Handlers ---
  const handleDeleteAppData = (scope: 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri') => {
    const confirmationMessage: Record<typeof scope, string> = {
        all: "Möchten Sie wirklich ALLE Anwendungsdaten (Apps, MemoMea, ReadLateR, CollMea, AuriMea) unwiderruflich löschen?",
        apps: "Möchten Sie wirklich ALLE Apps löschen?",
        memo: "Möchten Sie wirklich ALLE MemoMea-Einträge löschen?",
        read: "Möchten Sie wirklich ALLE ReadLateR-Lesezeichen löschen?",
        coll: "Möchten Sie wirklich ALLE CollMea-Sammlungen löschen?",
        auri: "Möchten Sie wirklich ALLE AuriMea-Daten (Konten, Transaktionen etc.) löschen?",
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
        
        setIsDeleteModalOpen(false);
        ui.showNotification("Erfolg", "Die ausgewählten Daten wurden gelöscht.", 'success');
      }
    );
  };

  const handleExportData = async (scope: 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri' | 'memomd') => {
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

  // --- New Item Handler ---
  const handleAddNew = () => {
    if (isDesktop) {
        if (nav.activeMyProject === MyProject.MemoMea) data.journal.handleAddNewJournalEntry();
        else if (nav.activeMyProject === MyProject.ReadLateR) ui.setIsBookmarkModalOpen(true);
        else if (nav.activeMyProject === MyProject.CollMea) ui.setCollectionFormModal({ isOpen: true, mode: 'add' });
        else if (nav.activeView === View.Apps) ui.setAppFormModal({ isOpen: true, mode: 'add' });
    } else { // Mobile
      if (nav.activeView === View.MyProjects && nav.activeMobileContent?.type === 'MY_PROJECT') {
          const projectId = (nav.activeMobileContent as any).projectId;
          if (projectId === MyProject.MemoMea) data.journal.handleAddNewJournalEntry();
          else if (projectId === MyProject.ReadLateR) ui.setIsBookmarkModalOpen(true);
          else if (projectId === MyProject.CollMea) {
              if (nav.activeCollectionId) {
                  data.collections.handleAddNewCollectionItem(nav.activeCollectionId);
              } else {
                  ui.setCollectionFormModal({ isOpen: true, mode: 'add' });
              }
          }
      } else if (nav.activeView === View.Apps && nav.activeMobileContent?.type === 'VIEW_LINK') {
          ui.setAppFormModal({ isOpen: true, mode: 'add' });
      }
    }
  };
  
  const handleExitAuriMeaSetup = () => {
    if (isDesktop) {
        nav.handleMyProjectSelect(null);
    } else {
        nav.handleCloseMobileContent();
    }
  };

  // --- Render Logic ---
  const renderContent = () => {
    const activeProject = isDesktop ? nav.activeMyProject : (nav.activeMobileContent?.type === 'MY_PROJECT' ? (nav.activeMobileContent as any).projectId : null);
    const activeAppView = isDesktop ? nav.activeView === View.Apps : nav.activeMobileContent?.type === 'VIEW_LINK';

    if (activeProject === MyProject.MemoMea) {
        return <MemoMeaView 
            entries={data.journal.journalEntries}
            entryCount={data.journal.journalEntries.length}
            searchQuery={searchQuery}
            onUpdate={data.journal.handleUpdateJournalEntry}
            onDelete={data.journal.handleDeleteJournalEntry}
            onTagClick={(tag) => setSearchQuery(`#${tag}`)}
            onSuggestedTagsChange={setSuggestedTags}
            showConfirmation={ui.showConfirmation}
            onAddNew={data.journal.handleAddNewJournalEntry}
            isMobileView={!isDesktop}
            onBack={nav.handleCloseMobileContent}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onClearSearch={() => setSearchQuery('')}
            suggestedTags={suggestedTags}
        />;
    }
    if (activeProject === MyProject.ReadLateR) {
        return <ReadLateRView 
            bookmarks={data.bookmarks.bookmarks}
            onDelete={data.bookmarks.handleDeleteBookmark}
            onToggleArchive={data.bookmarks.handleToggleArchiveBookmark}
            searchQuery={searchQuery}
            showArchived={data.bookmarks.readLaterShowArchived}
            onToggleShowArchived={() => data.bookmarks.setReadLaterShowArchived(prev => !prev)}
            onAddNew={() => ui.setIsBookmarkModalOpen(true)}
            isMobileView={!isDesktop}
            onBack={nav.handleCloseMobileContent}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onClearSearch={() => setSearchQuery('')}
        />;
    }
    if (activeProject === MyProject.CollMea) {
        return <CollMeaView 
            collections={data.collections.collections}
            searchQuery={searchQuery}
            activeCollectionId={nav.activeCollectionId}
            onCollectionSelect={(id) => nav.setActiveCollectionId(id)}
            onBackToOverview={() => nav.setActiveCollectionId(null)}
            onSaveCollection={data.collections.handleSaveCollection}
            onDeleteCollection={(id) => ui.showConfirmation("Sammlung löschen?", "Möchten Sie diese Sammlung und alle ihre Elemente wirklich löschen?", () => data.collections.handleDeleteCollection(id, () => nav.setActiveCollectionId(null)))}
            onUpdateItem={data.collections.handleUpdateCollectionItem}
            onDeleteItem={data.collections.handleDeleteCollectionItem}
            onAddNew={handleAddNew}
            onAddNewItem={data.collections.handleAddNewCollectionItem}
            isMobileView={!isDesktop}
            onBack={nav.handleCloseMobileContent}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onClearSearch={() => setSearchQuery('')}
        />;
    }
    if (activeProject === MyProject.AuriMea) {
        return <AuriMeaApp onExitSetup={handleExitAuriMeaSetup} />;
    }
    if (activeProject === MyProject.FWDaten) {
        return <PlaceholderView title="FW-Daten" icon="ssid_chart" />;
    }
    if (activeProject === MyProject.Flashcards) {
        return <PlaceholderView title="Flashcards" icon="style" />;
    }
    if (activeAppView) {
        return <AppsView 
            apps={data.apps.apps} 
            searchQuery={searchQuery}
            onContextMenu={ui.handleAppContextMenu}
            isMobileView={!isDesktop}
            onBack={nav.handleCloseMobileContent}
            onAddNew={handleAddNew}
        />;
    }

    return null;
  };

  const desktopHeaderProps = useMemo(() => {
    if (nav.activeMyProject) {
      if (nav.activeMyProject === MyProject.MemoMea) {
        const count = data.journal.journalEntries.length;
        return { title: 'MemoMea', subtitle: `${count} ${count === 1 ? 'Eintrag' : 'Einträge'}` };
      }
      return { title: MY_PROJECT_DEFINITIONS[nav.activeMyProject].label, subtitle: null };
    }
    if (nav.activeView === View.Apps) {
      return { title: 'Apps', subtitle: null };
    }
    return { title: 'Tools', subtitle: 'Wählen Sie ein Projekt aus' };
  }, [nav.activeMyProject, nav.activeView, data.journal.journalEntries.length]);
  
  return (
    <>
      {isDesktop ? (
          <DesktopLayout
              activeView={nav.activeView}
              onNavigate={(view) => { nav.setActiveMyProject(null); nav.setActiveView(view); }}
              activeMyProject={nav.activeMyProject}
              onMyProjectSelect={nav.handleMyProjectSelect}
              showSearchBar={(() => {
                  if (nav.activeView === View.Apps) return true;
                  if (nav.activeView === View.MyProjects && nav.activeMyProject) return ![MyProject.AuriMea, MyProject.FWDaten, MyProject.Flashcards].includes(nav.activeMyProject);
                  return false;
              })()}
              searchPlaceholder={(() => {
                  if (nav.activeMyProject === MyProject.MemoMea) return 'Einträge durchsuchen... (z.B. #tag)';
                  if (nav.activeMyProject === MyProject.ReadLateR) return 'Lesezeichen durchsuchen...';
                  if (nav.activeMyProject === MyProject.CollMea) return 'Sammlungen und Elemente durchsuchen...';
                  if (nav.activeView === View.Apps) return "Apps durchsuchen...";
                  return '';
              })()}
              searchValue={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.target.value)}
              onClearSearch={() => setSearchQuery('')}
              suggestedTags={suggestedTags}
              onTagClick={(tag) => setSearchQuery(`#${tag}`)}
              headerTitle={desktopHeaderProps.title}
              headerSubtitle={desktopHeaderProps.subtitle}
              headerActions={(() => {
                  const actions = [];
                  if (nav.activeMyProject === MyProject.ReadLateR) {
                      actions.push(<button key="toggle-archive" onClick={() => data.bookmarks.setReadLaterShowArchived(p => !p)} className="flex items-center font-medium py-2 px-4 rounded-lg transition-colors bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap"><span className="material-symbols-outlined mr-2 text-lg">{data.bookmarks.readLaterShowArchived ? 'unarchive' : 'archive'}</span><span>{data.bookmarks.readLaterShowArchived ? "Aktive anzeigen" : "Archiv anzeigen"}</span></button>);
                  }
                  if (nav.activeMyProject && [MyProject.MemoMea, MyProject.ReadLateR, MyProject.CollMea].includes(nav.activeMyProject) || nav.activeView === View.Apps) {
                      actions.push(<button key="add-new" onClick={handleAddNew} className="flex items-center font-bold py-2 px-4 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap"><span className="material-symbols-outlined mr-2 text-lg">add_circle</span><span>Neu</span></button>);
                  }
                  return actions;
              })()}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              isSubAppActive={nav.activeMyProject === MyProject.AuriMea}
          >
              {renderContent()}
          </DesktopLayout>
      ) : (
          <MobileLayout
              tiles={data.tiles.tiles}
              onTileClick={(tile) => nav.handleTileClick(tile, () => nav.setActiveView(tile.type === 'VIEW_LINK' ? tile.viewId : View.MyProjects))}
              activeMobileContent={nav.activeMobileContent}
              projectDefinitions={MY_PROJECT_DEFINITIONS}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
          >
              {renderContent()}
          </MobileLayout>
      )}

      {/* --- Global Modals & Overlays --- */}
      <NotificationModal isOpen={ui.notification.isOpen} onClose={ui.closeNotification} title={ui.notification.title} message={ui.notification.message} type={ui.notification.type} onConfirm={ui.notification.onConfirm} />
      {ui.appFormModal.isOpen && <AppFormModal mode={ui.appFormModal.mode} app={ui.appFormModal.app} onClose={() => ui.setAppFormModal({ isOpen: false, mode: 'add' })} onSave={(appData, id) => { data.apps.handleSaveApp(appData, id); ui.closeAllPopups(); }} />}
      {ui.isBookmarkModalOpen && <BookmarkFormModal isOpen={ui.isBookmarkModalOpen} onClose={() => ui.setIsBookmarkModalOpen(false)} onSave={(url) => { data.bookmarks.handleAddNewBookmark(url); ui.setIsBookmarkModalOpen(false); }} />}
      {ui.collectionFormModal.isOpen && <CollectionFormModal mode={ui.collectionFormModal.mode} collection={ui.collectionFormModal.collection} onClose={() => ui.setCollectionFormModal({ isOpen: false, mode: 'add' })} onSave={(collectionData, id) => { data.collections.handleSaveCollection(collectionData, id); ui.closeAllPopups(); }} />}
      {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} onExportClick={() => { setIsSettingsModalOpen(false); ui.setBackupModalState({ isOpen: true, mode: 'export', scope: null }); }} onImportClick={() => { setIsSettingsModalOpen(false); ui.setBackupModalState({ isOpen: true, mode: 'import', scope: null }); }} onDeleteAllClick={() => { setIsSettingsModalOpen(false); setIsDeleteModalOpen(true); }} isDesktop={isDesktop} />}
      {ui.backupModalState.isOpen && <BackupModal mode={ui.backupModalState.mode} scope={ui.backupModalState.scope} onClose={() => ui.setBackupModalState({ isOpen: false, mode: 'export', scope: null })} onExport={handleExportData} onImport={handleImportData} />}
      <DeleteDataModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteAppData} />
      {ui.isAppContextMenuOpen && ui.selectedAppForMenu && (
          <ContextMenu
              position={ui.appContextMenuPosition}
              onClose={ui.closeAllPopups}
              items={[
                  { label: 'Bearbeiten', icon: 'edit', onClick: () => ui.handleOpenEditModal(ui.selectedAppForMenu) },
                  { label: ui.selectedAppForMenu.isFavorite ? 'Lösen' : 'Anheften', icon: 'push_pin', onClick: () => data.apps.handleToggleFavorite(ui.selectedAppForMenu!.id, ui.closeAllPopups) },
                  { label: 'Löschen', icon: 'delete', onClick: () => ui.showConfirmation("App löschen?", "Möchten Sie diese App wirklich löschen?", () => data.apps.handleDeleteApp(ui.selectedAppForMenu!.id, ui.closeAllPopups)), className: 'bg-red-900/40 active:bg-red-900/60 text-red-300' },
              ]}
          />
      )}
    </>
  );
};

export default App;
