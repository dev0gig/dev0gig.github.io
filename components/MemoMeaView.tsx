
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import ContextMenu from './ContextMenu';

interface MemoMeaViewProps {
  entries: JournalEntry[];
  entryCount: number;
  searchQuery: string;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  onSuggestedTagsChange: (tags: string[]) => void;
  showConfirmation: (title: string, message: string | React.ReactNode, onConfirm: () => void) => void;
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

const TagCloud: React.FC<{ tags: { tag: string; count: number }[], onTagClick: (tag: string) => void }> = ({ tags, onTagClick }) => {
    const counts = tags.map(t => t.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const getFontSize = (count: number) => {
        if (maxCount === minCount) return '1em';
        const minSize = 0.8; // rem
        const maxSize = 1.6; // rem
        const size = minSize + (maxSize - minSize) * (Math.log(count) - Math.log(minCount)) / (Math.log(maxCount) - Math.log(minCount) || 1);
        return `${size}rem`;
    };

    return (
        <div className="flex flex-wrap gap-x-3 gap-y-4 items-baseline">
            {tags.map(({ tag, count }) => (
                <button
                    key={tag}
                    onClick={() => onTagClick(tag)}
                    className="text-zinc-400 hover:text-violet-400 transition-colors leading-none font-medium"
                    style={{ fontSize: getFontSize(count) }}
                    aria-label={`Filter by tag: ${tag}`}
                >
                    #{tag}
                </button>
            ))}
        </div>
    );
};


const MemoMeaView: React.FC<MemoMeaViewProps> = ({ entries, entryCount, searchQuery, onUpdate, onDelete, onTagClick, onSuggestedTagsChange, showConfirmation, onAddNew, isMobileView = false, onBack, onSearchChange, onClearSearch, suggestedTags = [] }) => {
  const [visibleEntriesCount, setVisibleEntriesCount] = useState(10);
  const [isTagCloudOpen, setIsTagCloudOpen] = useState(false);
  const entriesPerLoad = 10;
  
  const lowercasedQuery = searchQuery.toLowerCase();
  const isTagSearch = lowercasedQuery.startsWith('#');
  const plainQuery = isTagSearch ? lowercasedQuery.substring(1) : lowercasedQuery;

  const allTagsWithCounts = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    entries.forEach(entry => {
        const tags = extractTags(entry.content);
        tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => a.tag.localeCompare(b.tag));
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
      return allTagsWithCounts.map(t => t.tag).filter(tag => tag.toLowerCase().includes(plainQuery));
  }, [plainQuery, allTagsWithCounts, isTagSearch]);

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
              <p className="mt-1 text-zinc-500 mb-6">Erstelle deinen ersten Eintrag, um loszulegen.</p>
              <button
                onClick={onAddNew}
                className="flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
              >
                <span className="material-symbols-outlined mr-2">add_circle</span>
                <span>Ersten Eintrag erstellen</span>
              </button>
            </>
          ) : (
            <>
               <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">search_off</span>
               <h2 className="text-2xl font-bold text-zinc-400">Nichts gefunden</h2>
               <p className="mt-1 text-zinc-500">Für "{searchQuery}" gibt es keine Treffer.</p>
               {isTagSearch && (
                  <button onClick={() => onTagClick('')} className="mt-4 text-violet-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-md px-2 py-1">
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
                className="bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-200 font-semibold py-2.5 px-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
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

  const memoMeaOnTagClick = (tag: string) => {
    onTagClick(tag);
    if (isMobileView) {
        setIsTagCloudOpen(false);
    }
  };

  const tagCloudComponent = allTagsWithCounts.length > 0 ? (
    <div className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-lg font-bold text-zinc-200 mb-4 flex-shrink-0">Tag-Wolke</h3>
      <div className="overflow-y-auto no-scrollbar flex-grow">
        <TagCloud tags={allTagsWithCounts} onTagClick={memoMeaOnTagClick} />
      </div>
    </div>
  ) : null;
  
  const desktopView = (
    <div className="flex h-full gap-6">
        <div className={`flex-1 ${tagCloudComponent ? 'overflow-y-auto pr-2' : ''}`}>
            {content}
        </div>
        {tagCloudComponent && (
            <aside className="w-72 flex-shrink-0">
                <div className="sticky top-0 p-1 max-h-[calc(100vh-8rem)]">
                    {tagCloudComponent}
                </div>
            </aside>
        )}
    </div>
  );


  return (
    <div className={`animate-fadeIn ${isMobileView ? 'h-full flex flex-col' : ''}`}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {isMobileView ? (
        <>
            <div className="p-4 sm:p-6 pb-0 flex flex-col h-full">
                <header className="flex items-center justify-between text-zinc-300 mb-0 flex-shrink-0 flex-nowrap gap-x-2">
                    {onBack && (
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 flex-shrink-0" aria-label="Zurück">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <div className="flex items-center space-x-2 flex-grow min-w-0">
                        <span className="material-symbols-outlined text-3xl">edit_note</span>
                        <div className="flex items-baseline space-x-3 min-w-0">
                          <h1 className="text-2xl font-bold tracking-tight truncate">MemoMea</h1>
                          <span className="text-xs font-medium text-zinc-500 hidden sm:inline whitespace-nowrap flex-shrink-0">{entryCount} {entryCount === 1 ? 'Eintrag' : 'Einträge'}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        {tagCloudComponent && (
                            <button
                                onClick={() => setIsTagCloudOpen(true)}
                                className="flex items-center justify-center font-medium w-10 h-10 rounded-lg transition-colors bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                                aria-label="Tag-Wolke anzeigen"
                            >
                                <span className="material-symbols-outlined text-lg">tag</span>
                            </button>
                        )}
                        <button
                            onClick={onAddNew}
                            className="flex items-center justify-center font-bold w-10 h-10 sm:w-auto sm:h-auto sm:py-2 sm:px-3 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap"
                            aria-label="Neu"
                        >
                            <span className="material-symbols-outlined text-lg sm:mr-1">add_circle</span>
                            <span className="hidden sm:inline">Neu</span>
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-700 focus:ring-violet-500"
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
            {isTagCloudOpen && (
                <div className="fixed inset-0 z-40 bg-zinc-900/80 backdrop-blur-sm flex flex-col p-4 animate-fadeIn" onClick={() => setIsTagCloudOpen(false)}>
                    <div className="bg-zinc-800 rounded-xl flex flex-col h-full max-h-[80vh] m-auto w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <header className="flex justify-between items-center p-4 border-b border-zinc-700 flex-shrink-0">
                            <h2 className="text-xl font-bold text-zinc-100">Tag-Wolke</h2>
                            <button onClick={() => setIsTagCloudOpen(false)} className="p-2 -m-2 rounded-full hover:bg-zinc-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        <div className="flex-grow overflow-y-auto p-6">
                            {tagCloudComponent}
                        </div>
                    </div>
                </div>
            )}
        </>
      ) : desktopView}
    </div>
  );
};

export default MemoMeaView;
