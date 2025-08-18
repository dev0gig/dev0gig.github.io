
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import ContextMenu from './ContextMenu';

interface MemoMeaViewProps {
  entries: JournalEntry[];
  searchQuery: string;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  onSuggestedTagsChange: (tags: string[]) => void;
  showConfirmation: (title: string, message: string | React.ReactNode, onConfirm: () => void) => void;
  onOpenBackupModal: (mode: 'export' | 'import', scope: 'memo') => void;
  onAddNew: () => void;
  isMobileView?: boolean;
  onBack?: () => void;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch?: () => void;
  suggestedTags?: string[];
}

const extractTags = (content: string): string[] => {
  const regex = /#([a-zA-Z0-9_äöüÄÖÜß]+)/g;
  const matches = content.match(regex);
  if (!matches) {
    return [];
  }
  // Return unique tag names without the '#' prefix
  return [...new Set(matches.map(tag => tag.substring(1)))];
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};


const MemoMeaView: React.FC<MemoMeaViewProps> = ({ entries, searchQuery, onUpdate, onDelete, onTagClick, onSuggestedTagsChange, showConfirmation, onOpenBackupModal, onAddNew, isMobileView = false, onBack, onSearchChange, onClearSearch, suggestedTags = [] }) => {
  const [visibleEntriesCount, setVisibleEntriesCount] = useState(10);
  const entriesPerLoad = 10;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleMenuOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 8, left: rect.right });
    setIsMenuOpen(true);
  };
  
  const lowercasedQuery = searchQuery.toLowerCase();
  const isTagSearch = lowercasedQuery.startsWith('#');
  const plainQuery = isTagSearch ? lowercasedQuery.substring(1) : lowercasedQuery;

  const allUniqueTags = useMemo(() => {
    const allTags = entries.flatMap(entry => extractTags(entry.content));
    return [...new Set(allTags)].sort((a,b) => a.localeCompare(b));
  }, [entries]);

  const { taggedEntries, unlinkedEntries, filteredEntries } = useMemo(() => {
    if (!plainQuery) {
        return { taggedEntries: [], unlinkedEntries: [], filteredEntries: entries };
    }

    if (isTagSearch) {
        const tagged: JournalEntry[] = [];
        const unlinked: JournalEntry[] = [];
        const escapedQuery = escapeRegExp(plainQuery);
        
        entries.forEach(entry => {
            const entryTags = extractTags(entry.content).map(t => t.toLowerCase());
            const hasTag = entryTags.includes(plainQuery);
            const hasText = new RegExp(`\\b${escapedQuery}\\b`, 'i').test(entry.content);
            
            if (hasTag) {
                tagged.push(entry);
            } else if (hasText) {
                unlinked.push(entry);
            }
        });
        
        return { taggedEntries: tagged, unlinkedEntries: unlinked, filteredEntries: [...tagged, ...unlinked] };
    } 
    
    // Regular search
    const regularFiltered = entries.filter(entry => {
        const entryTags = extractTags(entry.content).map(t => t.toLowerCase());
        const contentMatch = entry.content.toLowerCase().includes(plainQuery);
        const dateMatch = new Date(entry.createdAt).toLocaleString('de-DE').includes(plainQuery);
        const tagMatch = entryTags.some(tag => tag.includes(plainQuery));
        return contentMatch || dateMatch || tagMatch;
    });
    return { taggedEntries: [], unlinkedEntries: [], filteredEntries: regularFiltered };
    
  }, [searchQuery, entries, isTagSearch, plainQuery]);

  const internalSuggestedTags = useMemo(() => {
      if (!plainQuery || isTagSearch) {
          return []; // Don't show suggestions if search is empty or is already a tag search
      }
      return allUniqueTags.filter(tag => tag.toLowerCase().includes(plainQuery));
  }, [plainQuery, allUniqueTags, isTagSearch]);

  useEffect(() => {
    onSuggestedTagsChange(internalSuggestedTags);
  }, [internalSuggestedTags, onSuggestedTagsChange]);


  useEffect(() => {
    setVisibleEntriesCount(entriesPerLoad);
  }, [searchQuery, entries.length]);

  const currentEntries = filteredEntries.slice(0, visibleEntriesCount);
  const hasMoreEntries = visibleEntriesCount < filteredEntries.length;

  const showPlaceholder = filteredEntries.length === 0;

  const content = (
    <>
      {showPlaceholder ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-zinc-500 min-h-[300px]">
          {entries.length === 0 ? (
            <>
              <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">note_add</span>
              <h2 className="text-2xl font-bold text-zinc-400">Keine Einträge</h2>
              <p className="mt-1 text-zinc-500">Drücke "Neu", um deinen ersten Eintrag zu erstellen.</p>
            </>
          ) : (
            <>
               <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">search_off</span>
               <h2 className="text-2xl font-bold text-zinc-400">Nichts gefunden</h2>
               <p className="mt-1 text-zinc-500">Für "{searchQuery}" gibt es keine Treffer.</p>
               {isTagSearch && (
                  <button onClick={() => onTagClick('')} className="mt-4 text-violet-400 active:underline font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-md px-2 py-1">
                      Tag-Filter zurücksetzen
                  </button>
               )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentEntries.map((entry, index) => {
              const showSeparator = isTagSearch &&
                                    unlinkedEntries.length > 0 &&
                                    taggedEntries.length > 0 &&
                                    index === taggedEntries.length;

              return (
                <React.Fragment key={entry.id}>
                  {showSeparator && (
                    <div className="flex items-center my-4" aria-hidden="true">
                      <div className="flex-grow border-t border-zinc-700"></div>
                      <span className="flex-shrink mx-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                        Unverknüpft
                      </span>
                      <div className="flex-grow border-t border-zinc-700"></div>
                    </div>
                  )}
                  <JournalEntryCard
                    entry={entry}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onTagClick={onTagClick}
                    showConfirmation={showConfirmation}
                  />
                </React.Fragment>
              );
            })}
          </div>
          {hasMoreEntries && (
            <div className="mt-8 mb-4 text-center">
                <button
                onClick={() => setVisibleEntriesCount(prevCount => prevCount + entriesPerLoad)}
                className="bg-zinc-700/50 active:bg-zinc-700/80 text-zinc-200 font-semibold py-2.5 px-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                aria-label={`Lade ${Math.min(entriesPerLoad, filteredEntries.length - visibleEntriesCount)} weitere Einträge`}
                >
                Mehr laden ({filteredEntries.length - visibleEntriesCount} verbleibend)
                </button>
            </div>
          )}
        </>
      )}
    </>
  );


  return (
    <div className={`animate-fadeIn ${isMobileView ? 'h-full flex flex-col' : ''} ${showPlaceholder && !isMobileView ? 'h-full flex flex-col' : ''}`}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      
      {isMobileView ? (
        <div className="p-4 sm:p-6 pb-0 flex flex-col h-full">
            <header className="flex items-center justify-between text-zinc-300 mb-0 flex-shrink-0 flex-wrap gap-y-4">
                {onBack && (
                    <button onClick={onBack} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="flex items-center space-x-2 flex-grow">
                    <span className="material-symbols-outlined text-3xl">edit_note</span>
                    <h1 className="text-2xl font-bold tracking-tight">MemoMea</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleMenuOpen}
                        className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                        aria-label="Aktionen für MemoMea"
                    >
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </header>

            {onSearchChange && onClearSearch && (
                <div className="relative my-4 flex-shrink-0">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
                    <input
                        type="text"
                        placeholder="Suche in MemoMea..."
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="w-full bg-zinc-700/50 border border-transparent rounded-full py-2.5 pl-11 pr-11 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                        aria-label="Suche in MemoMea"
                    />
                    {searchQuery && (
                        <button
                            onClick={onClearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-700 focus:ring-violet-500"
                            aria-label="Suche löschen"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    )}
                </div>
            )}

            {isMobileView && suggestedTags.length > 0 && (
              <div className="pb-4 flex-shrink-0">
                  <p className="text-sm font-medium text-zinc-400 mb-2">Tag-Vorschläge:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => onTagClick(tag)}
                        className="bg-violet-500/20 text-violet-300 hover:bg-violet-500/40 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                        aria-label={`Nach Tag filtern: ${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto -mr-4 sm:-mr-6 pr-4 sm:pr-6">
                {content}
            </div>
        </div>
      ) : content}

      {isMenuOpen && (
        <ContextMenu
            position={menuPosition}
            onClose={() => setIsMenuOpen(false)}
            isViewportAware={true}
            animationClass="animate-fadeIn"
            items={[
                { label: 'Neuer Eintrag', icon: 'add_circle', onClick: () => { setIsMenuOpen(false); onAddNew(); } },
                { label: 'Importieren', icon: 'input', onClick: () => { setIsMenuOpen(false); onOpenBackupModal('import', 'memo'); } },
                { label: 'Exportieren', icon: 'upload_file', onClick: () => { setIsMenuOpen(false); onOpenBackupModal('export', 'memo'); } },
            ]}
        />
      )}
    </div>
  );
};

export default MemoMeaView;