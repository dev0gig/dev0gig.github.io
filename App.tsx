
import React, { useState, useEffect } from 'react';
import { View, MyProject, AppItem, ExternalProjectItem, Tile, Collection } from './types';

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
import ExternalProjectsView from './components/ExternalProjectsView';
import ExternalProjectIframeView from './components/ExternalProjectIframeView';
import SplitViewContainer from './components/SplitViewContainer';
import NotificationModal from './components/NotificationModal';

// Data
import { externalProjects as externalProjectsData } from './data/externalProjects';

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


const MY_PROJECT_DEFINITIONS: Record<MyProject, { label: string; icon: string }> = {
  [MyProject.MemoMea]: { label: 'MemoMea', icon: 'edit_note' },
  [MyProject.ReadLateR]: { label: 'ReadLateR', icon: 'bookmark' },
  [MyProject.CollMea]: { label: 'CollMea', icon: 'collections_bookmark' },
};

const extractTags = (content: string): string[] => {
  const regex = /#([a-zA-Z0-9_äöüÄÖÜß]+)/g;
  const matches = content.match(regex);
  if (!matches) {
    return [];
  }
  return [...new Set(matches.map(tag => tag.substring(1)))];
};

const App: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // --- Custom Hooks for State Management ---
  const data = {
      apps: useApps(),
      journal: useJournal(),
      bookmarks: useBookmarks(),
      collections: useCollections(),
      tiles: useTiles(),
  };
  const ui = useUIState();
  const nav = useNavigation();
  
  // --- History / Back Button Management ---
  const isOverlayVisible =
    ui.notification.isOpen ||
    ui.isAppContextMenuOpen ||
    ui.externalProjectContextMenu.isOpen ||
    ui.appFormModal.isOpen ||
    ui.isBookmarkModalOpen ||
    ui.collectionFormModal.isOpen ||
    ui.backupModalState.isOpen ||
    !!nav.activeMobileContent ||
    (isDesktop && (!!nav.activeCollectionId || !!nav.activeMyProject || !!nav.activeExternalProjects.left || !!nav.activeExternalProjects.right));
  
  const closeTopOverlay = () => {
      if (ui.notification.isOpen) ui.closeNotification();
      else if (ui.isAppContextMenuOpen || ui.externalProjectContextMenu.isOpen) ui.closeAllPopups();
      else if (ui.appFormModal.isOpen) ui.setAppFormModal({ isOpen: false, mode: 'add' });
      else if (ui.isBookmarkModalOpen) ui.setIsBookmarkModalOpen(false);
      else if (ui.collectionFormModal.isOpen) ui.setCollectionFormModal({ isOpen: false, mode: 'add' });
      else if (ui.backupModalState.isOpen) ui.setBackupModalState({ isOpen: false, mode: 'export', scope: null });
      else if (!isDesktop && nav.activeMobileContent) nav.handleCloseMobileContent();
      else if (isDesktop) {
          if (nav.activeExternalProjects.right) nav.handleCloseExternalProject('right');
          else if (nav.activeExternalProjects.left) nav.handleCloseExternalProject('left');
          else if (nav.activeCollectionId) nav.setActiveCollectionId(null);
          else if (nav.activeMyProject) nav.handleMyProjectSelect(null);
      }
  };
  useHistoryStack({ isOverlayVisible, closeTopOverlay });

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [journalSearchQuery, setJournalSearchQuery] = useState('');
  const [readLaterSearchQuery, setReadLaterSearchQuery] = useState('');
  const [collmeaSearchQuery, setCollmeaSearchQuery] = useState('');
  const [suggestedJournalTags, setSuggestedJournalTags] = useState<string[]>([]);
  
  // --- Navigation & Action Handler ---
  const handleNavigate = (view: View) => {
    ui.closeAllPopups();
    if (view === View.ExternalProjects) nav.setActiveMobileContent(null);

    if (view === View.New) {
        switch (nav.activeView) {
            case View.Apps:
              ui.setAppFormModal({ isOpen: true, mode: 'add' });
              break;
            case View.MyProjects:
              switch(nav.activeMyProject) {
                  case MyProject.MemoMea: data.journal.handleAddNewJournalEntry(); break;
                  case MyProject.ReadLateR: ui.setIsBookmarkModalOpen(true); break;
                  case MyProject.CollMea: 
                    if (nav.activeCollectionId && !isDesktop) data.collections.handleAddNewCollectionItem(nav.activeCollectionId);
                    else ui.setCollectionFormModal({ isOpen: true, mode: 'add' });
                    break;
                  default: ui.showNotification('Kein Projekt ausgewählt', 'Bitte wählen Sie zuerst ein Projekt aus.', 'info'); break;
              }
              break;
            default: ui.showNotification('Nicht verfügbar', 'Diese Funktion ist in der aktuellen Ansicht nicht verfügbar.', 'info'); break;
          }
        return;
    }
    
    if (nav.activeView !== view) {
        setSearchQuery(''); setJournalSearchQuery(''); setReadLaterSearchQuery(''); setCollmeaSearchQuery('');
        nav.handleMyProjectSelect(null);
        nav.setActiveView(view);
    }
  };

  // --- Backup Handlers ---
  const handleExport = (scope: 'apps' | 'memo' | 'read' | 'coll') => {
    const dataToExport: any = {};
    if (scope === 'apps') dataToExport.apps = data.apps.apps;
    if (scope === 'memo') dataToExport.journalEntries = data.journal.journalEntries;
    if (scope === 'read') dataToExport.bookmarks = data.bookmarks.bookmarks;
    if (scope === 'coll') dataToExport.collections = data.collections.collections;

    const scopeToNameMap = {
      apps: 'apps',
      memo: 'memomea',
      read: 'readlater',
      coll: 'collmea',
    };
    const projectName = scopeToNameMap[scope];
    
    const jsonString = JSON.stringify({ backupType: scope, createdAt: new Date().toISOString(), data: dataToExport }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `axismea-backup-${projectName}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    ui.closeAllPopups();
  };

  const handleImport = async (file: File) => {
    try {
        const json = await file.text();
        if (!json) { ui.showNotification('Importfehler', 'Die Backup-Datei ist leer.', 'error'); return; }
        const backupData = JSON.parse(json);

        if (typeof backupData !== 'object' || backupData === null || !backupData.data) {
            ui.showNotification('Importfehler', 'Ungültiges Backup-Dateiformat.', 'error'); return;
        }
        
        const importables = Object.keys(backupData.data).join(', ');
        ui.showConfirmation(
            "Daten importieren?",
            `Dies überschreibt vorhandene Daten für: ${importables}. Fortfahren?`,
            () => {
                if (backupData.data.apps) data.apps.setApps(backupData.data.apps);
                if (backupData.data.journalEntries) data.journal.setJournalEntries(backupData.data.journalEntries);
                if (backupData.data.bookmarks) data.bookmarks.setBookmarks(backupData.data.bookmarks);
                if (backupData.data.collections) data.collections.setCollections(backupData.data.collections);
                if (backupData.data.tiles) data.tiles.setTiles(backupData.data.tiles);
                ui.showNotification('Import erfolgreich!', 'Die Daten wurden wiederhergestellt.', 'success');
                ui.closeAllPopups();
            }
        );
    } catch (error) {
        ui.showNotification('Import fehlgeschlagen', 'Die Datei ist möglicherweise beschädigt.', 'error');
    }
  };
  
  // --- Render Logic ---
  const isMemoMeaActive = nav.activeView === View.MyProjects && nav.activeMyProject === MyProject.MemoMea;
  const isReadLateRActive = nav.activeView === View.MyProjects && nav.activeMyProject === MyProject.ReadLateR;
  const isCollMeaActive = nav.activeView === View.MyProjects && nav.activeMyProject === MyProject.CollMea;

  const renderDesktopContent = () => {
    switch (nav.activeView) {
      case View.Apps:
        return <AppsView apps={data.apps.apps} searchQuery={searchQuery} onContextMenu={ui.handleAppContextMenu} />;
      case View.MyProjects:
        switch(nav.activeMyProject) {
            case MyProject.MemoMea: return <MemoMeaView key={MyProject.MemoMea} entries={data.journal.journalEntries} searchQuery={journalSearchQuery} onUpdate={data.journal.handleUpdateJournalEntry} onDelete={data.journal.handleDeleteJournalEntry} onTagClick={(tag) => setJournalSearchQuery(tag ? `#${tag}` : '')} onSuggestedTagsChange={setSuggestedJournalTags} showConfirmation={ui.showConfirmation} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={data.journal.handleAddNewJournalEntry} />;
            case MyProject.ReadLateR: return <ReadLateRView key={MyProject.ReadLateR} bookmarks={data.bookmarks.bookmarks} onDelete={data.bookmarks.handleDeleteBookmark} onToggleArchive={data.bookmarks.handleToggleArchiveBookmark} searchQuery={readLaterSearchQuery} showArchived={data.bookmarks.readLaterShowArchived} onToggleShowArchived={() => data.bookmarks.setReadLaterShowArchived(p => !p)} isMobileView={false} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={() => ui.setIsBookmarkModalOpen(true)} />;
            case MyProject.CollMea: return <CollMeaView key={MyProject.CollMea} collections={data.collections.collections} activeCollectionId={nav.activeCollectionId} onCollectionSelect={nav.setActiveCollectionId} onBackToOverview={() => nav.setActiveCollectionId(null)} onSaveCollection={data.collections.handleSaveCollection} onDeleteCollection={(id) => ui.showConfirmation("Sammlung löschen?", "Sind Sie sicher?", () => data.collections.handleDeleteCollection(id, () => nav.setActiveCollectionId(null)))} onUpdateItem={data.collections.handleUpdateCollectionItem} onDeleteItem={data.collections.handleDeleteCollectionItem} searchQuery={collmeaSearchQuery} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={() => { if (nav.activeCollectionId && !isDesktop) { data.collections.handleAddNewCollectionItem(nav.activeCollectionId); } else { ui.setCollectionFormModal({ isOpen: true, mode: 'add' }); } }} onAddNewItem={data.collections.handleAddNewCollectionItem} />;
            default: return <MemoMeaView key="default-memo" entries={data.journal.journalEntries} searchQuery={journalSearchQuery} onUpdate={data.journal.handleUpdateJournalEntry} onDelete={data.journal.handleDeleteJournalEntry} onTagClick={(tag) => setJournalSearchQuery(tag ? `#${tag}` : '')} onSuggestedTagsChange={setSuggestedJournalTags} showConfirmation={ui.showConfirmation} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={data.journal.handleAddNewJournalEntry} />;
        }
      case View.ExternalProjects:
        if (nav.activeExternalProjects.left || nav.activeExternalProjects.right) {
            return <SplitViewContainer leftProject={nav.activeExternalProjects.left} rightProject={nav.activeExternalProjects.right} onClose={nav.handleCloseExternalProject} />;
        }
        return <ExternalProjectsView projects={externalProjectsData} onProjectSelect={(project) => nav.handleExternalProjectSelect(project, 'full', ui.closeAllPopups)} />;
      default: return <MemoMeaView key="fallback-memo" entries={data.journal.journalEntries} searchQuery={journalSearchQuery} onUpdate={data.journal.handleUpdateJournalEntry} onDelete={data.journal.handleDeleteJournalEntry} onTagClick={(tag) => setJournalSearchQuery(tag ? `#${tag}` : '')} onSuggestedTagsChange={setSuggestedJournalTags} showConfirmation={ui.showConfirmation} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={data.journal.handleAddNewJournalEntry} />;
    }
  };

  const renderMobileContent = (tile: Tile) => {
    const mobileProps = { isMobileView: true, onBack: nav.handleCloseMobileContent };
    switch (tile.type) {
      case 'MY_PROJECT':
        switch(tile.projectId) {
            case MyProject.MemoMea: return <MemoMeaView {...mobileProps} entries={data.journal.journalEntries} searchQuery={journalSearchQuery} onUpdate={data.journal.handleUpdateJournalEntry} onDelete={data.journal.handleDeleteJournalEntry} onTagClick={(tag) => setJournalSearchQuery(tag ? `#${tag}` : '')} onSuggestedTagsChange={setSuggestedJournalTags} showConfirmation={ui.showConfirmation} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={data.journal.handleAddNewJournalEntry} onSearchChange={(e) => setJournalSearchQuery(e.target.value)} onClearSearch={() => setJournalSearchQuery('')} suggestedTags={suggestedJournalTags} />;
            case MyProject.ReadLateR: return <ReadLateRView {...mobileProps} bookmarks={data.bookmarks.bookmarks} onDelete={data.bookmarks.handleDeleteBookmark} onToggleArchive={data.bookmarks.handleToggleArchiveBookmark} searchQuery={readLaterSearchQuery} showArchived={data.bookmarks.readLaterShowArchived} onToggleShowArchived={() => data.bookmarks.setReadLaterShowArchived(p => !p)} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={() => ui.setIsBookmarkModalOpen(true)} onSearchChange={(e) => setReadLaterSearchQuery(e.target.value)} onClearSearch={() => setReadLaterSearchQuery('')} />;
            case MyProject.CollMea: return <CollMeaView {...mobileProps} collections={data.collections.collections} activeCollectionId={nav.activeCollectionId} onCollectionSelect={nav.setActiveCollectionId} onBackToOverview={() => nav.setActiveCollectionId(null)} onSaveCollection={data.collections.handleSaveCollection} onDeleteCollection={(id) => ui.showConfirmation("Sammlung löschen?", "Sind Sie sicher?", () => data.collections.handleDeleteCollection(id, () => nav.setActiveCollectionId(null)))} onUpdateItem={data.collections.handleUpdateCollectionItem} onDeleteItem={data.collections.handleDeleteCollectionItem} searchQuery={collmeaSearchQuery} onOpenBackupModal={(mode, scope) => ui.setBackupModalState({isOpen: true, mode, scope})} onAddNew={() => { if (nav.activeCollectionId) { data.collections.handleAddNewCollectionItem(nav.activeCollectionId); } else { ui.setCollectionFormModal({ isOpen: true, mode: 'add' }); } }} onSearchChange={(e) => setCollmeaSearchQuery(e.target.value)} onClearSearch={() => setCollmeaSearchQuery('')} />;
        }
        break;
      case 'EXTERNAL_PROJECT': return <ExternalProjectIframeView project={tile.project} />;
      case 'VIEW_LINK': if (tile.viewId === View.Apps) return <AppsView {...mobileProps} apps={data.apps.apps} searchQuery="" onContextMenu={ui.handleAppContextMenu} onAddNew={() => ui.setAppFormModal({ isOpen: true, mode: 'add' })} onOpenBackupModal={(mode) => ui.setBackupModalState({isOpen: true, mode, scope: 'apps'})} />; break;
    }
    return null;
  }
  
  const showSearchBar = (nav.activeView === View.Apps || isMemoMeaActive || isReadLateRActive || isCollMeaActive);
  const searchPlaceholder = isMemoMeaActive ? "Suche in MemoMea..." : isReadLateRActive ? "Suche in Lesezeichen..." : isCollMeaActive ? "Suche in Sammlungen..." : "Suche nach Apps...";
  const searchValue = isMemoMeaActive ? journalSearchQuery : isReadLateRActive ? readLaterSearchQuery : isCollMeaActive ? collmeaSearchQuery : searchQuery;
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isMemoMeaActive) setJournalSearchQuery(value);
    else if (isReadLateRActive) setReadLaterSearchQuery(value);
    else if (isCollMeaActive) setCollmeaSearchQuery(value);
    else setSearchQuery(value);
  };
  const handleClearSearch = () => {
    if (isMemoMeaActive) setJournalSearchQuery(''); else if (isReadLateRActive) setReadLaterSearchQuery(''); else if (isCollMeaActive) setCollmeaSearchQuery(''); else setSearchQuery('');
  };
  
  // --- Dynamic Desktop Header Generation ---
  let headerTitle: string | null = null, headerSubtitle: string | null = null, headerActions: React.ReactNode[] = [];
  if (isDesktop) {
      const btnClass = "flex items-center font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 whitespace-nowrap";
      const secBtn = `${btnClass} bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 focus:ring-violet-500`;
      const primBtn = `${btnClass} bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500`;
      const icon = (name: string) => <span className="material-symbols-outlined mr-2 text-base">{name}</span>;

      if (nav.activeView === View.Apps) {
          headerTitle = "Apps";
          headerSubtitle = `${data.apps.apps.length} App(s)`;
          headerActions = [
              <button key="import" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'import', scope: 'apps'})} className={secBtn}>{icon('input')}<span>Importieren</span></button>,
              <button key="export" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'export', scope: 'apps'})} className={secBtn}>{icon('upload_file')}<span>Exportieren</span></button>,
              <button key="add" onClick={() => ui.setAppFormModal({ isOpen: true, mode: 'add' })} className={primBtn}>{icon('add_circle')}<span>Neu</span></button>
          ];
      } else if (isMemoMeaActive) {
          headerTitle = "MemoMea";
          headerSubtitle = `${data.journal.journalEntries.length} Einträge • ${[...new Set(data.journal.journalEntries.flatMap(e => extractTags(e.content)))].length} Tags`;
          headerActions = [
              <button key="import" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'import', scope: 'memo'})} className={secBtn}>{icon('input')}<span>Importieren</span></button>,
              <button key="export" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'export', scope: 'memo'})} className={secBtn}>{icon('upload_file')}<span>Exportieren</span></button>,
              <button key="add" onClick={data.journal.handleAddNewJournalEntry} className={primBtn}>{icon('add_circle')}<span>Neu</span></button>
          ];
      } else if (isReadLateRActive) {
          headerTitle = "ReadLateR";
          const activeCount = data.bookmarks.bookmarks.filter(b => !b.isArchived).length;
          headerSubtitle = data.bookmarks.readLaterShowArchived ? `${data.bookmarks.bookmarks.length - activeCount} archiviert` : `${activeCount} aktiv`;
          headerActions = [
              <button key="toggle-archive" onClick={() => data.bookmarks.setReadLaterShowArchived(p => !p)} className={secBtn}>{icon(data.bookmarks.readLaterShowArchived ? 'unarchive' : 'archive')}<span>{data.bookmarks.readLaterShowArchived ? "Aktive" : "Archiv"}</span></button>,
              <button key="import" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'import', scope: 'read'})} className={secBtn}>{icon('input')}<span>Importieren</span></button>,
              <button key="export" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'export', scope: 'read'})} className={secBtn}>{icon('upload_file')}<span>Exportieren</span></button>,
              <button key="add" onClick={() => ui.setIsBookmarkModalOpen(true)} className={primBtn}>{icon('add_circle')}<span>Neu</span></button>
          ];
      } else if (isCollMeaActive) {
          if (isDesktop) {
              headerTitle = "CollMea";
              headerSubtitle = `${data.collections.collections.length} Sammlung(en)`;
              headerActions = [
                  <button key="import" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'import', scope: 'coll'})} className={secBtn}>{icon('input')}<span>Importieren</span></button>,
                  <button key="export" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'export', scope: 'coll'})} className={secBtn}>{icon('upload_file')}<span>Exportieren</span></button>,
                  <button key="add" onClick={() => ui.setCollectionFormModal({ isOpen: true, mode: 'add' })} className={primBtn}>{icon('add_circle')}<span>Neu</span></button>
              ];
          } else if (nav.activeCollectionId) {
              const activeCollection = data.collections.collections.find(c => c.id === nav.activeCollectionId);
              headerTitle = activeCollection?.name || "Sammlung";
              headerSubtitle = `${activeCollection?.items.length || 0} Element(e)`;
              headerActions = [
                  <button key="back" onClick={() => nav.setActiveCollectionId(null)} className={secBtn}>{icon('arrow_back')}<span>Übersicht</span></button>,
                  <button key="add" onClick={() => data.collections.handleAddNewCollectionItem(nav.activeCollectionId!)} className={primBtn}>{icon('add_circle')}<span>Neu</span></button>
              ];
          } else {
              headerTitle = "CollMea";
              headerSubtitle = `${data.collections.collections.length} Sammlung(en)`;
              headerActions = [
                  <button key="import" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'import', scope: 'coll'})} className={secBtn}>{icon('input')}<span>Importieren</span></button>,
                  <button key="export" onClick={() => ui.setBackupModalState({isOpen: true, mode: 'export', scope: 'coll'})} className={secBtn}>{icon('upload_file')}<span>Exportieren</span></button>,
                  <button key="add" onClick={() => ui.setCollectionFormModal({ isOpen: true, mode: 'add' })} className={primBtn}>{icon('add_circle')}<span>Neu</span></button>
              ];
          }
      }
  }

  const desktopLayoutProps = {
    activeView: nav.activeView, onNavigate: handleNavigate,
    showSearchBar, searchPlaceholder, searchValue, onSearchChange: handleSearchChange, onClearSearch: handleClearSearch,
    suggestedTags: isMemoMeaActive ? suggestedJournalTags : [], onTagClick: (tag: string) => setJournalSearchQuery(tag ? `#${tag}` : ''),
    externalProjects: externalProjectsData, onExternalProjectSelect: (project: ExternalProjectItem) => nav.handleExternalProjectSelect(project, 'full', ui.closeAllPopups),
    onExternalProjectContextMenu: ui.handleExternalProjectContextMenu, activeExternalProjects: nav.activeExternalProjects,
    activeMyProject: nav.activeMyProject, onMyProjectSelect: nav.handleMyProjectSelect,
    headerTitle, headerSubtitle, headerActions
  };


  return (
    <>
      {isDesktop ? (
          <DesktopLayout {...desktopLayoutProps}>
              {renderDesktopContent()}
          </DesktopLayout>
      ) : (
          <MobileLayout
            tiles={data.tiles.tiles}
            onTileClick={(tile) => nav.handleTileClick(tile, ui.closeAllPopups)}
            onReorderTiles={data.tiles.handleReorderTiles}
            activeMobileContent={nav.activeMobileContent}
            projectDefinitions={MY_PROJECT_DEFINITIONS}
          >
             {nav.activeMobileContent && renderMobileContent(nav.activeMobileContent)}
          </MobileLayout>
      )}

      {ui.backupModalState.isOpen && <BackupModal mode={ui.backupModalState.mode} scope={ui.backupModalState.scope} onClose={ui.closeAllPopups} onExport={handleExport} onImport={handleImport} />}
      {ui.appFormModal.isOpen && <AppFormModal mode={ui.appFormModal.mode} app={ui.appFormModal.app} onClose={ui.closeAllPopups} onSave={(appData, id) => { data.apps.handleSaveApp(appData, id); ui.closeAllPopups(); }} />}
      {ui.isBookmarkModalOpen && <BookmarkFormModal isOpen={ui.isBookmarkModalOpen} onClose={ui.closeAllPopups} onSave={(url) => { data.bookmarks.handleAddNewBookmark(url); ui.closeAllPopups(); }} />}
      {ui.collectionFormModal.isOpen && <CollectionFormModal mode={ui.collectionFormModal.mode} collection={ui.collectionFormModal.collection} onClose={ui.closeAllPopups} onSave={(collectionData, id) => { data.collections.handleSaveCollection(collectionData, id); ui.closeAllPopups(); }} />}
      {ui.notification.isOpen && <NotificationModal {...ui.notification} onClose={ui.closeNotification} />}
      {ui.isAppContextMenuOpen && ui.selectedAppForMenu && (
         <ContextMenu position={ui.appContextMenuPosition} onClose={ui.closeAllPopups} isViewportAware={true} animationClass="animate-fadeIn" items={[ { label: ui.selectedAppForMenu.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren', icon: ui.selectedAppForMenu.isFavorite ? 'star_half' : 'star', onClick: () => data.apps.handleToggleFavorite(ui.selectedAppForMenu!.id, ui.closeAllPopups) }, { label: 'Bearbeiten', icon: 'edit', onClick: () => ui.handleOpenEditModal(ui.selectedAppForMenu) }, { label: 'Löschen', icon: 'delete', onClick: () => ui.showConfirmation('App löschen?', `Möchten Sie "${ui.selectedAppForMenu!.ariaLabel}" wirklich löschen?`, () => data.apps.handleDeleteApp(ui.selectedAppForMenu!.id, ui.closeAllPopups)), className: 'text-red-400' } ]} />
      )}
      {ui.externalProjectContextMenu.isOpen && ui.externalProjectContextMenu.project && (
        <ContextMenu position={ui.externalProjectContextMenu.position} onClose={ui.closeAllPopups} isViewportAware={true} animationClass="animate-fadeIn" items={[ { label: 'Open Fullscreen', icon: 'fullscreen', onClick: () => nav.handleExternalProjectSelect(ui.externalProjectContextMenu.project!, 'full', ui.closeAllPopups) }, { label: 'Open in Left View', icon: 'align_horizontal_left', onClick: () => nav.handleExternalProjectSelect(ui.externalProjectContextMenu.project!, 'left', ui.closeAllPopups) }, { label: 'Open in Right View', icon: 'align_horizontal_right', onClick: () => nav.handleExternalProjectSelect(ui.externalProjectContextMenu.project!, 'right', ui.closeAllPopups) } ]} />
      )}
    </>
  );
};

export default App;
