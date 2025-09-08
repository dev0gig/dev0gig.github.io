

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import ContextMenu from './ContextMenu';

const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface MemoMeaCalendarProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string | null;
  onDateSelect: (date: Date | null) => void;
  entryDates: Set<string>; // 'YYYY-MM-DD'
}

const MemoMeaCalendar: React.FC<MemoMeaCalendarProps> = ({ currentDate, onMonthChange, selectedDate, onDateSelect, entryDates }) => {
    const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    const handlePrevMonth = () => onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleGoToToday = () => onMonthChange(new Date());

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const todayString = toYYYYMMDD(new Date());

        const firstDayOfMonth = new Date(year, month, 1);
        let startDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6; // Adjust Sunday

        const gridStartDate = new Date(firstDayOfMonth);
        gridStartDate.setDate(gridStartDate.getDate() - startDayOfWeek);

        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(gridStartDate);
            date.setDate(date.getDate() + i);
            const dateString = toYYYYMMDD(date);
            
            days.push({
                key: dateString,
                date: date,
                isToday: dateString === todayString,
                hasEntry: entryDates.has(dateString),
                isCurrentMonth: date.getMonth() === month,
                isSelected: selectedDate === dateString,
            });
        }
        return days;
    }, [currentDate, entryDates, selectedDate]);

    return (
        <div className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 flex flex-col">
            <header className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-zinc-100">{monthName}</h3>
                <div className="flex items-center space-x-1">
                    <button onClick={handleGoToToday} className="text-xs font-semibold text-zinc-300 bg-zinc-700/50 hover:bg-zinc-700/80 px-2 py-1 rounded-md transition-colors">Heute</button>
                    <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-zinc-700 transition-colors" aria-label="Vorheriger Monat"><span className="material-symbols-outlined text-xl">chevron_left</span></button>
                    <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-zinc-700 transition-colors" aria-label="Nächster Monat"><span className="material-symbols-outlined text-xl">chevron_right</span></button>
                </div>
            </header>
            <div className="grid grid-cols-7 gap-1 text-center">
                {dayHeaders.map(header => (
                    <div key={header} className="font-semibold text-zinc-400 text-xs py-1">{header}</div>
                ))}
                {calendarGrid.map(day => (
                    <button
                        key={day.key}
                        onClick={() => onDateSelect(day.date)}
                        className={`
                            relative w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500
                            ${day.isSelected ? 'ring-2 ring-violet-400 bg-violet-500/20' : ''}
                            ${!day.isSelected && day.isCurrentMonth ? 'hover:bg-zinc-700/50' : ''}
                            ${day.isToday ? 'bg-violet-600 text-white font-bold' : (day.isCurrentMonth ? 'text-zinc-200' : 'text-zinc-600')}
                        `}
                    >
                        {day.date.getDate()}
                        {day.hasEntry && (
                            <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-white' : 'bg-violet-400'}`} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

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
        if (maxCount === minCount) return '0.85rem';
        const minSize = 0.75; // rem
        const maxSize = 1.25; // rem
        const size = minSize + (maxSize - minSize) * (Math.log(count) - Math.log(minCount)) / (Math.log(maxCount) - Math.log(minCount) || 1);
        return `${size}rem`;
    };

    const colors = [
        'bg-violet-500/10 hover:bg-violet-500/20 text-violet-300',
        'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300',
        'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300',
        'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
        'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300',
        'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300',
        'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300',
    ];

    const stringToHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    const getColorClass = (tag: string) => {
        const hash = stringToHash(tag);
        return colors[hash % colors.length];
    };

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {tags.map(({ tag, count }) => (
                <button
                    key={tag}
                    onClick={() => onTagClick(tag)}
                    className={`px-3 py-1.5 rounded-full transition-colors font-medium leading-none flex items-center ${getColorClass(tag)}`}
                    style={{ fontSize: getFontSize(count) }}
                    aria-label={`Filter by tag: ${tag}`}
                >
                    <span className="opacity-60 mr-1">#</span>{tag}
                </button>
            ))}
        </div>
    );
};


const MemoMeaView: React.FC<MemoMeaViewProps> = ({ entries, entryCount, searchQuery, onUpdate, onDelete, onTagClick, onSuggestedTagsChange, showConfirmation, onAddNew, isMobileView = false, onBack, onSearchChange, onClearSearch, suggestedTags = [] }) => {
  const [visibleEntriesCount, setVisibleEntriesCount] = useState(10);
  const entriesPerLoad = 10;
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
  
  const entryDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(entry => {
        dates.add(toYYYYMMDD(new Date(entry.createdAt)));
    });
    return dates;
  }, [entries]);

  const handleDateSelect = (date: Date | null) => {
    const dateString = date ? toYYYYMMDD(date) : null;
    if (selectedDate && dateString && selectedDate === dateString) {
        setSelectedDate(null); // Toggle off if same date is clicked
    } else {
        setSelectedDate(dateString);
    }
  };

  const handleLocalTagClick = (tag: string) => {
    onTagClick(tag);
    setSelectedDate(null);
  };

  const { taggedEntries, unlinkedEntries, filteredEntries } = useMemo(() => {
    const dateFilter = (entry: JournalEntry) => {
        if (!selectedDate) return true;
        const entryDateString = toYYYYMMDD(new Date(entry.createdAt));
        return entryDateString === selectedDate;
    };

    if (!plainQuery) {
        return { taggedEntries: [], unlinkedEntries: [], filteredEntries: entries.filter(dateFilter) };
    }

    if (isTagSearch) {
        const tagged: JournalEntry[] = [];
        const unlinked: JournalEntry[] = [];
        const escapedQuery = escapeRegExp(plainQuery);
        
        entries.forEach(entry => {
            const entryTags = extractTags(entry.content).map(t => t.toLowerCase());
            const hasTag = entryTags.includes(plainQuery);
            const hasText = new RegExp(`\\b${escapedQuery}\\b`, 'i').test(entry.content);
            
            if (hasTag) tagged.push(entry);
            else if (hasText) unlinked.push(entry);
        });
        
        const finalTagged = tagged.filter(dateFilter);
        const finalUnlinked = unlinked.filter(dateFilter);
        return { taggedEntries: finalTagged, unlinkedEntries: finalUnlinked, filteredEntries: [...finalTagged, ...finalUnlinked] };
    } 
    
    // Regular search
    const regularFiltered = entries.filter(entry => {
        const entryTags = extractTags(entry.content).map(t => t.toLowerCase());
        const contentMatch = entry.content.toLowerCase().includes(plainQuery);
        const dateMatch = new Date(entry.createdAt).toLocaleString('de-DE').includes(plainQuery);
        const tagMatch = entryTags.some(tag => tag.includes(plainQuery));
        return contentMatch || dateMatch || tagMatch;
    });
    return { taggedEntries: [], unlinkedEntries: [], filteredEntries: regularFiltered.filter(dateFilter) };
    
  }, [searchQuery, entries, isTagSearch, plainQuery, selectedDate]);

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
  }, [searchQuery, entries.length, selectedDate]);

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
               {selectedDate ? (
                    <p className="mt-1 text-zinc-500">Für den {new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('de-DE')} {searchQuery ? `und die Suche "${searchQuery}"` : ''} gibt es keine Treffer.</p>
                ) : (
                    <p className="mt-1 text-zinc-500">Für "{searchQuery}" gibt es keine Treffer.</p>
                )}
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
                    onTagClick={handleLocalTagClick}
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

  const calendarComponent = (
    <MemoMeaCalendar
        currentDate={calendarDate}
        onMonthChange={setCalendarDate}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        entryDates={entryDates}
    />
  );
  
  const tagCloudComponent = allTagsWithCounts.length > 0 ? (
    <div className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 flex flex-col flex-grow min-h-0">
      <h3 className="text-lg font-bold text-zinc-200 mb-4 flex-shrink-0">Tag-Wolke</h3>
      <div className="overflow-y-auto no-scrollbar flex-grow">
        <TagCloud tags={allTagsWithCounts} onTagClick={handleLocalTagClick} />
      </div>
    </div>
  ) : null;
  
  const desktopView = (
    <div className="flex h-full gap-6">
        <div className="flex-grow overflow-y-auto pr-2">
            {selectedDate && (
                 <div className="mb-4 p-3 bg-zinc-800/70 rounded-lg flex justify-between items-center border border-zinc-700/60">
                    <p className="text-zinc-300 text-sm">
                        Zeige Einträge für: <span className="font-bold text-white">{new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </p>
                    <button 
                        onClick={() => setSelectedDate(null)}
                        className="text-violet-400 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-sm"
                    >
                        Filter zurücksetzen
                    </button>
                </div>
            )}
            {content}
        </div>
        <aside className="w-80 flex-shrink-0 h-full flex flex-col gap-6">
            {calendarComponent}
            {tagCloudComponent}
        </aside>
    </div>
  );


  return (
    <div className={`h-full ${isMobileView ? 'flex flex-col' : ''}`}>
      <style>{`
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
        </>
      ) : desktopView}
    </div>
  );
};

export default MemoMeaView;
