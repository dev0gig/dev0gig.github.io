
import React, { useState, useEffect, useMemo } from 'react';
import { View, MyProject, Tile, JournalEntry } from './types';

// Components
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import MainContent from './components/MainContent';
import GlobalModals from './components/GlobalModals';

// Hooks
import { useMediaQuery } from './hooks/useMediaQuery';
import { useJournal } from './hooks/useJournal';
import { useTiles } from './hooks/useTiles';
import { useUIState } from './hooks/useUIState';
import { useNavigation } from './hooks/useNavigation';
import { useHistoryStack } from './hooks/useHistoryStack';
import { useAuriMeaData } from './hooks/useAuriMeaData';
import { useDataManager } from './hooks/useDataManager';


const MY_PROJECT_DEFINITIONS: Record<MyProject, { label: string; icon: string }> = {
  [MyProject.MemoMea]: { label: 'MemoMea', icon: 'edit_note' },
  [MyProject.AuriMea]: { label: 'AuriMea', icon: 'payments' },
};

const App: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Custom Hooks for State Management ---
  const data = {
      journal: useJournal(),
      tiles: useTiles(),
      auriMea: useAuriMeaData(),
  };
  const ui = useUIState();
  const nav = useNavigation();
  const { handleExportData, handleImportData, handleDeleteAppData, handleExportMemoMeaAsMarkdown } = useDataManager({ data, ui, setIsDeleteModalOpen });
  
  // --- History / Back Button Management ---
  const isOverlayVisible =
    ui.notification.isOpen ||
    ui.backupModalState.isOpen ||
    isSettingsModalOpen ||
    isDeleteModalOpen ||
    !!nav.activeMobileContent ||
    (isDesktop && !!nav.activeMyProject);
  
  const closeTopOverlay = () => {
      if (ui.notification.isOpen) ui.closeNotification();
      // FIX: Removed invalid 'scope' property. The backup modal state does not have a 'scope' property.
      else if (ui.backupModalState.isOpen) ui.setBackupModalState({ isOpen: false, mode: 'export' });
      else if (isSettingsModalOpen) setIsSettingsModalOpen(false);
      else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      else if (nav.activeMobileContent) nav.handleCloseMobileContent();
      else if (isDesktop) {
          if (nav.activeMyProject) {
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
  }, [nav.activeView, nav.activeMyProject]);

  // --- New Item Handler ---
  const handleAddNew = () => {
    if (isDesktop) {
        if (nav.activeMyProject === MyProject.MemoMea) data.journal.handleAddNewJournalEntry();
    } else { // Mobile
      if (nav.activeView === View.MyProjects && nav.activeMobileContent?.type === 'MY_PROJECT') {
          const projectId = (nav.activeMobileContent as any).projectId;
          if (projectId === MyProject.MemoMea) data.journal.handleAddNewJournalEntry();
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
      const projectDef = MY_PROJECT_DEFINITIONS[nav.activeMyProject];
      if (nav.activeMyProject === MyProject.MemoMea) {
        const count = data.journal.journalEntries.length;
        return { title: projectDef.label, subtitle: `${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`, icon: projectDef.icon };
      }
      return { title: projectDef.label, subtitle: null, icon: projectDef.icon };
    }
    return { title: 'Tools', subtitle: 'Wählen Sie ein Projekt aus', icon: 'category' };
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
                  if (nav.activeView === View.MyProjects && nav.activeMyProject) return ![MyProject.AuriMea].includes(nav.activeMyProject);
                  return false;
              })()}
              searchPlaceholder={(() => {
                  if (nav.activeMyProject === MyProject.MemoMea) return 'Einträge durchsuchen... (z.B. #tag)';
                  return '';
              })()}
              searchValue={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.target.value)}
              onClearSearch={() => setSearchQuery('')}
              suggestedTags={suggestedTags}
              onTagClick={(tag) => setSearchQuery(`#${tag}`)}
              headerTitle={desktopHeaderProps.title}
              headerIcon={desktopHeaderProps.icon}
              headerSubtitle={desktopHeaderProps.subtitle}
              headerActions={(() => {
                  const actions = [];
                  if (nav.activeMyProject && [MyProject.MemoMea].includes(nav.activeMyProject)) {
                      actions.push(<button key="add-new" onClick={handleAddNew} className="flex items-center font-bold py-2 px-4 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap"><span className="material-symbols-outlined mr-2 text-lg">add_circle</span><span>Neu</span></button>);
                  }
                  return actions;
              })()}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              isSubAppActive={[MyProject.AuriMea].includes(nav.activeMyProject as MyProject)}
          >
              <MainContent {...mainContentProps} />
          </DesktopLayout>
      ) : (
          <MobileLayout
              tiles={data.tiles.tiles}
              onTileClick={(tile) => nav.handleTileClick(tile, () => nav.setActiveView(View.MyProjects))}
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
          isSettingsModalOpen={isSettingsModalOpen}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          handleExportData={handleExportData}
          handleImportData={handleImportData}
          handleDeleteAppData={handleDeleteAppData}
          handleExportMemoMeaAsMarkdown={handleExportMemoMeaAsMarkdown}
          isDesktop={isDesktop}
        />
    </>
  );
};

export default App;