
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
  headerIcon?: string | null;
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
    headerIcon,
    headerSubtitle,
    headerActions,
    onOpenSettings,
    isSubAppActive = false,
}) => {
  const mainContentClass = `flex-1 overflow-y-auto ${!isSubAppActive ? 'p-4' : ''}`;

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
                  <div className="flex items-center space-x-4 overflow-hidden">
                      {headerIcon && <span className="material-symbols-outlined text-3xl text-violet-400 flex-shrink-0">{headerIcon}</span>}
                      <div className="overflow-hidden">
                          <h1 className="text-2xl font-bold tracking-tight text-white truncate" title={headerTitle}>{headerTitle}</h1>
                          {headerSubtitle && <p className="text-sm font-medium text-zinc-500 truncate" title={headerSubtitle}>{headerSubtitle}</p>}
                      </div>
                  </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-x-8 flex-grow max-w-4xl">
              {showSearchBar && (
                <div className={`relative w-full max-w-full`}>
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
