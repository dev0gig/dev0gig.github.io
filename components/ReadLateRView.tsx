


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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleMenuOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 8, left: rect.right });
    setIsMenuOpen(true);
  };

  const menuItems = [
    { label: 'Neues Lesezeichen', icon: 'add_circle', onClick: () => { setIsMenuOpen(false); onAddNew(); } },
    {
        label: showArchived ? "Aktive anzeigen" : "Archiv anzeigen",
        icon: showArchived ? 'unarchive' : 'archive',
        onClick: () => { setIsMenuOpen(false); onToggleShowArchived(); }
    },
  ];

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
        <div className={isMobileView ? "space-y-4 pb-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-4"}>
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
                    <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">
                        {showArchived ? 'archive' : 'bookmarks'}
                    </span>
                    <h2 className="text-2xl font-bold text-zinc-400">
                        {showArchived ? 'Archiv ist leer' : 'Keine Lesezeichen'}
                    </h2>
                    <p className="mt-1 text-zinc-500">
                        {showArchived 
                            ? 'Archivierte Lesezeichen werden hier angezeigt.' 
                            : 'Drücke "Neu", um dein erstes Lesezeichen zu speichern.'}
                    </p>
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
            <header className="flex items-center justify-between text-zinc-300 mb-0 flex-shrink-0 flex-wrap gap-y-4">
                {onBack && (
                    <button onClick={onBack} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="flex items-center space-x-2 flex-grow">
                    <span className="material-symbols-outlined text-3xl">bookmark</span>
                    <h1 className="text-2xl font-bold tracking-tight">ReadLateR</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                    onClick={handleMenuOpen}
                    className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    aria-label="Aktionen für ReadLateR"
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

      {isMenuOpen && isMobileView && (
        <ContextMenu
            position={menuPosition}
            onClose={() => setIsMenuOpen(false)}
            isViewportAware={true}
            animationClass="animate-fadeIn"
            items={menuItems}
        />
      )}
    </div>
  );
};

export default ReadLateRView;