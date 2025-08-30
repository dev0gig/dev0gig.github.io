import React from 'react';

import { MyProject, View } from '../types';
import MemoMeaView from './MemoMeaView';
import ReadLateRView from './ReadLateRView';
import CollMeaView from './CollMeaView';
import AuriMeaApp from './AuriMea';
import FwDatenApp from './FWDaten';
import FlashcardsView from './FlashcardsView';
import AppsView from './AppsView';

import { useNavigation } from '../hooks/useNavigation';
import { useApps } from '../hooks/useApps';
import { useJournal } from '../hooks/useJournal';
import { useBookmarks } from '../hooks/useBookmarks';
import { useCollections } from '../hooks/useCollections';
import { useAuriMeaData } from '../hooks/useAuriMeaData';
import { useUIState } from '../hooks/useUIState';
import { useFlashcardsData } from '../hooks/useFlashcardsData';

interface MainContentProps {
    isDesktop: boolean;
    nav: ReturnType<typeof useNavigation>;
    data: {
        apps: ReturnType<typeof useApps>;
        journal: ReturnType<typeof useJournal>;
        bookmarks: ReturnType<typeof useBookmarks>;
        collections: ReturnType<typeof useCollections>;
        auriMea: ReturnType<typeof useAuriMeaData>;
        flashcards: ReturnType<typeof useFlashcardsData>;
    };
    ui: ReturnType<typeof useUIState>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    suggestedTags: string[];
    setSuggestedTags: (tags: string[]) => void;
    handleAddNew: () => void;
    handleExitAuriMeaSetup: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
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
}) => {
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
        return <AuriMeaApp isMobileView={!isDesktop} onBack={handleExitAuriMeaSetup} auriMeaData={data.auriMea} />;
    }
    if (activeProject === MyProject.FWDaten) {
        return <FwDatenApp isMobileView={!isDesktop} onBack={nav.handleCloseMobileContent} />;
    }
    if (activeProject === MyProject.Flashcards) {
        return <FlashcardsView
            isMobileView={!isDesktop}
            onBack={nav.handleCloseMobileContent}
            showNotification={ui.showNotification}
            showConfirmation={ui.showConfirmation}
            deck={data.flashcards.deck}
            setDeck={data.flashcards.setDeck}
            deckName={data.flashcards.deckName}
            setDeckName={data.flashcards.setDeckName}
        />;
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

export default MainContent;