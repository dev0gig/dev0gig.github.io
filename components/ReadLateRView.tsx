
import React, { useState } from 'react';
import { BookmarkItem } from '../types';
import BookmarkItemCard from './BookmarkItemCard';
import ContextMenu from './ContextMenu';

interface ReadLateRViewProps {
  bookmarks: BookmarkItem[];
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
  searchQuery: string;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  isMobileView?: boolean;
  onAddNew: () => void;
  onBack?: () => void;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch?: () => void;
}

const ReadLateRView: React.FC<ReadLateRViewProps> = ({ bookmarks, onDelete, onToggleArchive, searchQuery, showArchived, onToggleShowArchived, isMobileView = false, onAddNew, onBack, onSearchChange, onClearSearch }) => {
  const lowercasedQuery = searchQuery.toLowerCase();

  // Filter by archive status first
  const listSource = bookmarks.filter(b => (b.isArchived || false) === showArchived);

  const filteredBookmarks = searchQuery
    ? listSource.filter(bookmark =>
        bookmark.title.toLowerCase().includes(lowercasedQuery) ||
        bookmark.url.toLowerCase().includes(lowercasedQuery)
      )
    : listSource;
  
  const activeCount = bookmarks.filter(b => !b.isArchived).length;
  const archivedCount = bookmarks.length - activeCount;

  const content = (
    <>
      {filteredBookmarks.length > 0 ? (
        <div className={isMobileView ? "space-y-4 pb-4" : "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4"}>
            {filteredBookmarks.map(bookmark => (
                <BookmarkItemCard 
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={onDelete}
                    onToggleArchive={onToggleArchive}
                />
            ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-zinc-500 min-h-[300px]">
            {searchQuery ? (
                 <>
                    <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">search_off</span>
                    <h2 className="text-2xl font-bold text-zinc-400">Nichts gefunden</h2>
                    <p className="mt-1 text-zinc-500">Für "{searchQuery}" gibt es keine Treffer.</p>
                 </>
            ) : (
                <>
                    {showArchived ? (
                        <>
                            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">archive</span>
                            <h2 className="text-2xl font-bold text-zinc-400">Archiv ist leer</h2>
                            <p className="mt-1 text-zinc-500">Archivierte Lesezeichen werden hier angezeigt.</p>
                        </>
                    ) : (
                         <>
                            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">bookmarks</span>
                            <h2 className="text-2xl font-bold text-zinc-400">Keine Lesezeichen</h2>
                            <p className="mt-1 text-zinc-500 mb-6">Füge dein erstes Lesezeichen hinzu, um es später zu lesen.</p>
                            <button
                                onClick={onAddNew}
                                className="flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                            >
                                <span className="material-symbols-outlined mr-2">add_circle</span>
                                <span>Erstes Lesezeichen erstellen</span>
                            </button>
                        </>
                    )}
                </>
            )}
        </div>
      )}
    </>
  );

  return (
    <div className={`animate-fadeIn h-full flex flex-col ${isMobileView ? '' : ''}`}>
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
            <header className="flex items-center justify-between text-zinc-300 mb-0 flex-shrink-0 flex-nowrap gap-x-2">
                {onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                    <span className="material-symbols-outlined text-3xl">bookmark</span>
                    <h1 className="text-2xl font-bold tracking-tight truncate">ReadLateR</h1>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                        onClick={onToggleShowArchived}
                        className="flex items-center justify-center font-medium w-10 h-10 sm:w-auto sm:h-auto sm:py-2 sm:px-3 rounded-lg transition-colors bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap"
                        aria-label={showArchived ? "Aktive anzeigen" : "Archiv anzeigen"}
                    >
                        <span className="material-symbols-outlined text-lg sm:mr-1">{showArchived ? 'unarchive' : 'archive'}</span>
                        <span className="hidden sm:inline">{showArchived ? "Aktive" : "Archiv"}</span>
                    </button>
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
                        placeholder="Suche in Lesezeichen..."
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="w-full bg-zinc-700/50 border border-transparent rounded-full py-2.5 pl-11 pr-11 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                        aria-label="Suche in Lesezeichen"
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

            <div className="flex-grow overflow-y-auto -mr-4 sm:-mr-6 pr-4 sm:pr-6">
                {content}
            </div>

        </div>
      ) : <div className="h-full overflow-y-auto">{content}</div>}
    </div>
  );
};

export default ReadLateRView;