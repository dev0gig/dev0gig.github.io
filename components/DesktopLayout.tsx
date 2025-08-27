





import React, { useState } from 'react';
import { View, MyProject } from '../types';
import Sidebar from './Sidebar';

interface DesktopLayoutProps {
  children: React.ReactNode;
  activeView: View;
  onNavigate: (view: View) => void;
  showSearchBar: boolean;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  suggestedTags: string[];
  onTagClick: (tag: string) => void;
  activeMyProject: MyProject | null;
  onMyProjectSelect: (project: MyProject) => void;
  headerTitle?: string | null;
  headerSubtitle?: string | null;
  headerActions?: React.ReactNode[];
  onOpenSettings: () => void;
  isSubAppActive?: boolean;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
    children,
    activeView,
    onNavigate,
    showSearchBar,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onClearSearch,
    suggestedTags,
    onTagClick,
    activeMyProject,
    onMyProjectSelect,
    headerTitle,
    headerSubtitle,
    headerActions,
    onOpenSettings,
    isSubAppActive = false,
}) => {
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const mainContentClass = `flex-1 overflow-y-auto ${!isSubAppActive ? 'p-4' : ''}`;

  const handleGoogleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleSearchQuery.trim()) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setGoogleSearchQuery('');
    }
  };

  return (
    <div className="h-dvh w-full flex bg-zinc-900 text-zinc-100 antialiased">
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        activeMyProject={activeMyProject}
        onMyProjectSelect={onMyProjectSelect}
        onOpenSettings={onOpenSettings}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {!isSubAppActive && (
          <header className="flex-shrink-0 h-20 px-4 flex items-center justify-between border-b border-zinc-800 gap-x-8">
            <div className="flex items-center justify-start flex-1 min-w-0">
              {headerTitle && (
                  <div className="flex items-baseline space-x-3 overflow-hidden">
                      <h1 className="text-2xl font-bold tracking-tight text-white truncate" title={headerTitle}>{headerTitle}</h1>
                      {headerSubtitle && <p className="text-xs font-medium text-zinc-500 truncate" title={headerSubtitle}>{headerSubtitle}</p>}
                  </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-x-8 flex-grow max-w-4xl">
              {showSearchBar && (
                <div className={`relative w-full ${activeView === View.Apps ? 'max-w-xl' : 'max-w-full'}`}>
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={onSearchChange}
                    className="h-12 w-full bg-zinc-800 border border-transparent rounded-full py-3 pl-12 pr-12 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    aria-label={searchPlaceholder}
                  />
                  {searchValue && (
                    <button
                      onClick={onClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
                      aria-label="Suche löschen"
                    >
                      <span className="material-symbols-outlined text-xl">
                        close
                      </span>
                    </button>
                  )}
                </div>
              )}

              {activeView === View.Apps && (
                <form 
                  onSubmit={handleGoogleSearchSubmit} 
                  className={`m-0 relative w-full ${showSearchBar ? 'max-w-sm' : 'max-w-xl'}`}
                >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png"
                      alt="Google"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 object-contain pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Bei Google suchen..."
                      value={googleSearchQuery}
                      onChange={(e) => setGoogleSearchQuery(e.target.value)}
                      className="h-12 w-full bg-zinc-800 border border-transparent rounded-full py-3 pl-12 pr-4 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      aria-label="Bei Google suchen"
                    />
                </form>
              )}
            </div>
            
            <div className="flex items-center justify-end flex-1 space-x-2">
               {headerActions && headerActions.length > 0 ? (
                  headerActions
               ) : null}
            </div>
          </header>
        )}
        
        {!isSubAppActive && showSearchBar && suggestedTags.length > 0 && (
          <div className="px-4 pt-4 pb-2 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-400">Tag-Vorschläge:</p>
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
          </div>
        )}

        <main className={mainContentClass}>
            {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;