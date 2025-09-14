
import React from 'react';

import { MyProject, View } from '../types';
import MemoMeaView from './MemoMeaView';
import AuriMeaApp from './AuriMea';

import { useNavigation } from '../hooks/useNavigation';
import { useJournal } from '../hooks/useJournal';
import { useAuriMeaData } from '../hooks/useAuriMeaData';
import { useUIState } from '../hooks/useUIState';

interface MainContentProps {
    isDesktop: boolean;
    nav: ReturnType<typeof useNavigation>;
    data: {
        journal: ReturnType<typeof useJournal>;
        auriMea: ReturnType<typeof useAuriMeaData>;
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
    
    if (activeProject === MyProject.AuriMea) {
        return <AuriMeaApp isMobileView={!isDesktop} onBack={handleExitAuriMeaSetup} auriMeaData={data.auriMea} />;
    }
    
    return null;
};

export default MainContent;
