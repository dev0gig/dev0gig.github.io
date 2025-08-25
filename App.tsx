

import React, { useState, useEffect, useMemo } from 'react';
import { View, MyProject, Tile, Collection, JournalEntry } from './types';

// Components
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import MainContent from './components/MainContent';
import GlobalModals from './components/GlobalModals';

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
import { useDataManager } from './hooks/useDataManager';


const MY_PROJECT_DEFINITIONS: Record<MyProject, { label: string; icon: string }> = {
  [MyProject.MemoMea]: { label: 'MemoMea', icon: 'edit_note' },
  [MyProject.ReadLateR]: { label: 'ReadLateR', icon: 'bookmark' },
  [MyProject.CollMea]: { label: 'CollMea', icon: 'collections_bookmark' },
  [MyProject.AuriMea]: { label: 'AuriMea', icon: 'payments' },
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
  const { handleExportData, handleImportData, handleDeleteAppData } = useDataManager({ data, ui, setIsDeleteModalOpen });
  
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
  
  const mainContentProps = {
    isDesktop,
    nav,
    data,
    ui,
    searchQuery,
    setSearchQuery,
    suggestedTags,
    setSuggestedTags,
    handleAddNew,
    handleExitAuriMeaSetup
  };

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
              isSubAppActive={[MyProject.AuriMea, MyProject.FWDaten, MyProject.Flashcards].includes(nav.activeMyProject as MyProject)}
          >
              <MainContent {...mainContentProps} />
          </DesktopLayout>
      ) : (
          <MobileLayout
              tiles={data.tiles.tiles}
              onTileClick={(tile) => nav.handleTileClick(tile, () => nav.setActiveView(tile.type === 'VIEW_LINK' ? tile.viewId : View.MyProjects))}
              activeMobileContent={nav.activeMobileContent}
              projectDefinitions={MY_PROJECT_DEFINITIONS}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
          >
              <MainContent {...mainContentProps} />
          </MobileLayout>
      )}

      {/* --- Global Modals & Overlays --- */}
      <GlobalModals
          ui={ui}
          data={data}
          isSettingsModalOpen={isSettingsModalOpen}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          handleExportData={handleExportData}
          handleImportData={handleImportData}
          handleDeleteAppData={handleDeleteAppData}
          isDesktop={isDesktop}
        />
    </>
  );
};

export default App;
