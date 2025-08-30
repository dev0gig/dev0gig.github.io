
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Collection, GenericListItem } from '../types';
import ContextMenu from './ContextMenu';

// --- Generic List Item Component ---
interface GenericListItemRowProps {
    item: GenericListItem;
    onUpdate: (item: GenericListItem) => void;
    onDelete: () => void;
    isMobileView: boolean;
}

const GenericListItemRow: React.FC<GenericListItemRowProps> = ({ item, onUpdate, onDelete, isMobileView }) => {
    const [isEditing, setIsEditing] = useState(() => item.title === '');
    const [title, setTitle] = useState(item.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...item, completed: e.target.checked });
    };

    const saveChanges = () => {
        if (title.trim() !== item.title.trim()) {
            onUpdate({ ...item, title: title.trim() });
        }
        setIsEditing(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveChanges();
        } else if (e.key === 'Escape') {
            setTitle(item.title);
            setIsEditing(false);
        }
    };

    return (
         <div className="group flex items-center bg-zinc-800/50 p-3 rounded-lg transition-colors hover:bg-zinc-800">
            <input
                type="checkbox"
                checked={item.completed}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-violet-500 focus:ring-violet-500 flex-shrink-0"
                aria-label={`Mark item ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
            />
            <div className="flex-grow mx-3" onClick={() => setIsEditing(true)}>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={saveChanges}
                        onKeyDown={handleKeyDown}
                        placeholder="Neues Element..."
                        className="w-full bg-transparent text-zinc-200 focus:outline-none"
                    />
                ) : (
                    <span className={`transition-colors ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {item.title || <span className="text-zinc-500 italic">Klicken zum Bearbeiten...</span>}
                    </span>
                )}
            </div>
            <button
                onClick={onDelete}
                className={`text-zinc-500 hover:text-red-400 transition-all duration-200 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/10 ${isMobileView ? 'opacity-100' : 'opacity-50 hover:opacity-100 group-hover:opacity-100 focus-within:opacity-100 group-focus-within:opacity-100'}`}
                aria-label="Element löschen"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
            </button>
        </div>
    );
};


// --- Main CollMea View Component ---
interface CollMeaViewProps {
  collections: Collection[];
  searchQuery: string;
  activeCollectionId: string | null;
  onCollectionSelect: (id: string) => void;
  onBackToOverview: () => void;
  onSaveCollection: (data: { name: string; icon: string }, id?: string) => void;
  onDeleteCollection: (id: string) => void;
  onUpdateItem: (collectionId: string, item: GenericListItem) => void;
  onDeleteItem: (collectionId: string, itemId: string) => void;
  onAddNew: () => void;
  onAddNewItem?: (collectionId: string) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch?: () => void;
}


const CollMeaView: React.FC<CollMeaViewProps> = ({
  collections,
  searchQuery,
  activeCollectionId,
  onCollectionSelect,
  onBackToOverview,
  onSaveCollection, // Not used yet, for future editing
  onDeleteCollection,
  onUpdateItem,
  onDeleteItem,
  onAddNew,
  onAddNewItem,
  isMobileView = false,
  onBack,
  onSearchChange,
  onClearSearch
}) => {

  const activeCollection = useMemo(() => {
    return collections.find(c => c.id === activeCollectionId) || null;
  }, [collections, activeCollectionId]);

  const lowercasedQuery = searchQuery.toLowerCase();
  
  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(lowercasedQuery) || 
    c.items.some(item => item.title.toLowerCase().includes(lowercasedQuery))
  );

  const filteredItems = useMemo(() => {
      if (!activeCollection) return [];
      if (!lowercasedQuery) return activeCollection.items;
      return activeCollection.items.filter(item => 
          item.title.toLowerCase().includes(lowercasedQuery)
      );
  }, [activeCollection, lowercasedQuery]);


  // --- Render Collection Overview ---
  const renderOverview = () => (
    <>
        {isMobileView && (
            <header className="flex items-center justify-between text-zinc-300 mb-0 flex-shrink-0 flex-nowrap gap-x-2">
                {onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                    <span className="material-symbols-outlined text-3xl">collections_bookmark</span>
                    <h1 className="text-2xl font-bold tracking-tight truncate">CollMea</h1>
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
        )}
        <div className={isMobileView ? "pt-4" : ""}>
            {filteredCollections.length > 0 ? (
                <div className="space-y-4">
                    {filteredCollections.map(collection => (
                        <div
                            key={collection.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onCollectionSelect(collection.id)}
                            onKeyDown={e => e.key === 'Enter' && onCollectionSelect(collection.id)}
                            className="group bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 p-4 rounded-xl shadow-md transition-all hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center overflow-hidden mr-4">
                                    <span className="material-symbols-outlined mr-4 text-zinc-400 transition-colors">{collection.icon}</span>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-lg text-zinc-200 truncate">{collection.name}</p>
                                        <p className="text-sm text-zinc-500">{collection.items.length} Element(e)</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteCollection(collection.id); }}
                                    className={`text-zinc-500 hover:text-red-400 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 -mt-1 -mr-1 flex-shrink-0 ${isMobileView ? 'opacity-100' : 'opacity-50 hover:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100'}`}
                                    aria-label="Sammlung löschen"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                            {collection.items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-zinc-700/60 space-y-2">
                                    {collection.items.slice(0, 2).map(item => (
                                        <div key={item.id} className="flex items-center text-sm">
                                            <span className={`material-symbols-outlined text-lg mr-2.5 transition-colors ${item.completed ? 'text-violet-400' : 'text-zinc-500'}`}>
                                                {item.completed ? 'check_box' : 'check_box_outline_blank'}
                                            </span>
                                            <span className={`transition-colors truncate ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                                                {item.title || <span className="italic text-zinc-600">Leerer Eintrag</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
                            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">playlist_add</span>
                            <h2 className="text-2xl font-bold text-zinc-400">Keine Sammlungen</h2>
                            <p className="mt-1 text-zinc-500">Drücke "Neu", um deine erste Sammlung zu erstellen.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    </>
  );

  // --- Render Collection Detail View ---
  const renderDetailView = () => {
    if (!activeCollection) return null; // Should not happen if logic is correct

    return (
       <>
         {isMobileView && (
            <header className="flex items-center text-zinc-300 mb-0 flex-shrink-0 flex-nowrap gap-x-2">
                <button onClick={onBackToOverview} className="p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück zur Übersicht">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                    <span className="material-symbols-outlined text-3xl">{activeCollection.icon}</span>
                    <h1 className="text-2xl font-bold tracking-tight truncate">{activeCollection.name}</h1>
                </div>
                <button
                    onClick={onAddNew}
                    className="flex items-center justify-center font-bold w-10 h-10 sm:w-auto sm:h-auto sm:py-2 sm:px-3 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap flex-shrink-0"
                    aria-label="Neu"
                >
                    <span className="material-symbols-outlined text-lg sm:mr-1">add_circle</span>
                    <span className="hidden sm:inline">Neu</span>
                </button>
            </header>
         )}

         <div className={isMobileView ? "pt-4" : ""}>
            {filteredItems.length > 0 ? (
                <div className="space-y-3">
                    {filteredItems.map(item => (
                        <GenericListItemRow 
                            key={item.id}
                            item={item}
                            onUpdate={(updatedItem) => onUpdateItem(activeCollection.id, updatedItem)}
                            onDelete={() => onDeleteItem(activeCollection.id, item.id)}
                            isMobileView={isMobileView}
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
                            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">check_box_outline_blank</span>
                            <h2 className="text-2xl font-bold text-zinc-400">Liste ist leer</h2>
                            <p className="mt-1 text-zinc-500">Drücke "Neu", um ein Element hinzuzufügen.</p>
                        </>
                    )}
                </div>
            )}
         </div>
       </>
    );
  };
  
  if (isMobileView) {
      const MobileWrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
        // This wrapper sets up the mobile layout with header, search, and scrollable content
        return (
            <div className="p-4 sm:p-6 pb-0 flex flex-col h-full">
                {onSearchChange && onClearSearch && (
                    <div className="relative mb-4 flex-shrink-0">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
                        <input
                            type="text"
                            placeholder="Suche in Sammlungen..."
                            value={searchQuery}
                            onChange={onSearchChange}
                            className="w-full bg-zinc-700/50 border border-transparent rounded-full py-2.5 pl-11 pr-11 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                            aria-label="Suche in Sammlungen"
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
                <div className="flex-grow overflow-y-auto -mr-4 sm:-mr-6 pr-4 sm:pr-6">
                     {children}
                </div>
            </div>
        );
      }

    return (
        <div className={`animate-fadeIn h-full flex flex-col`}>
            <style>{`
                @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
            
            <MobileWrapper>
                {activeCollectionId ? renderDetailView() : renderOverview()}
            </MobileWrapper>
            
        </div>
      );
  }

  // --- New Desktop View ---
  return (
    <div className="flex h-full w-full gap-6 overflow-x-auto p-4">
        <style>{`
            /* Custom Scrollbar for Webkit-based browsers */
            .animate-fadeIn::-webkit-scrollbar {
                height: 10px;
            }
            .animate-fadeIn::-webkit-scrollbar-track {
                background: rgba(10, 10, 10, 0.2);
                border-radius: 10px;
            }
            .animate-fadeIn::-webkit-scrollbar-thumb {
                background-color: #52525b;
                border-radius: 10px;
                border: 2px solid transparent;
                background-clip: content-box;
            }
            .animate-fadeIn::-webkit-scrollbar-thumb:hover {
                background-color: #71717a;
            }
            /* Custom Scrollbar for Firefox */
            .animate-fadeIn {
                scrollbar-width: thin;
                scrollbar-color: #52525b rgba(10, 10, 10, 0.2);
            }
        `}</style>
        {filteredCollections.map(collection => (
            <div key={collection.id} className="w-96 h-full flex flex-col flex-shrink-0 bg-zinc-800/60 rounded-xl overflow-hidden border border-zinc-700/60">
                {/* Header */}
                <div className="p-3 border-b border-zinc-700/60 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <span className="material-symbols-outlined text-zinc-400">{collection.icon}</span>
                        <h2 className="font-bold text-zinc-200 truncate">{collection.name}</h2>
                        <span className="text-sm font-medium bg-zinc-700/80 text-zinc-300 rounded-full px-2 py-0.5 flex-shrink-0">{collection.items.length}</span>
                    </div>
                    <button
                        onClick={() => onDeleteCollection(collection.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-red-500/10"
                        aria-label="Sammlung löschen"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
                {/* Item List */}
                <div className="flex-grow overflow-y-auto p-3 space-y-2">
                    {collection.items.map(item => (
                        <GenericListItemRow
                            key={item.id}
                            item={item}
                            onUpdate={(updatedItem) => onUpdateItem(collection.id, updatedItem)}
                            onDelete={() => onDeleteItem(collection.id, item.id)}
                            isMobileView={isMobileView}
                        />
                    ))}
                </div>
                {/* Footer */}
                <div className="p-2 border-t border-zinc-700/60 flex-shrink-0">
                    <button
                        onClick={() => onAddNewItem && onAddNewItem(collection.id)}
                        className="w-full text-left p-2 rounded-lg flex items-center text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
                    >
                        <span className="material-symbols-outlined mr-2">add</span>
                        Neues Element
                    </button>
                </div>
            </div>
        ))}
        {/* Add New Collection Button */}
        <div className="w-96 h-full flex-shrink-0 p-4 flex items-center justify-center">
            <button
                onClick={onAddNew}
                className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/40 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:bg-zinc-800/80 hover:border-violet-500 hover:text-violet-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
            >
                <span className="material-symbols-outlined text-4xl">add</span>
                <span className="font-bold mt-2">Neue Sammlung</span>
            </button>
        </div>
    </div>
  );
};

export default CollMeaView;
