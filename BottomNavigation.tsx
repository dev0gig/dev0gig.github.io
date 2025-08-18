

import React from 'react';
import { View } from '../types';

interface BottomNavigationProps {
  activeView: View;
  onNavigate: (view: View) => void;
  showSearchBar: boolean;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  suggestedTags: string[];
  onTagClick: (tag: string) => void;
  isNewButtonDisabled: boolean;
}

interface NavItem {
  view: View;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { view: View.Apps, label: 'Apps', icon: 'apps' },
  { view: View.MyProjects, label: 'Projekte', icon: 'folder_managed' },
  { view: View.New, label: 'Neu', icon: 'add_circle' },
  { view: View.ExternalProjects, label: 'Extern', icon: 'public' },
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
    activeView, 
    onNavigate, 
    showSearchBar,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onClearSearch,
    suggestedTags,
    onTagClick,
    isNewButtonDisabled
}) => {
  return (
    <footer className="bg-zinc-800 border-t border-zinc-700/60">
      <div className="w-full max-w-screen-sm mx-auto">
        {suggestedTags.length > 0 && (
          <div className="px-4 pt-4 pb-3 border-b border-zinc-700/60">
            <p className="text-sm font-medium text-zinc-400 mb-2">Vorschläge für Tags:</p>
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
        {showSearchBar && (
          <div className="px-4 pb-2 pt-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                search
              </span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={onSearchChange}
                className="w-full bg-zinc-700 border border-transparent rounded-full py-2.5 pl-11 pr-11 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                aria-label={searchPlaceholder}
              />
              {searchValue && (
                <button
                  onClick={onClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-700 focus:ring-violet-500"
                  aria-label="Suche löschen"
                >
                  <span className="material-symbols-outlined text-xl">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center h-16">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            const isDisabled = item.view === View.New && isNewButtonDisabled;
            
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                disabled={isDisabled}
                className={`flex-1 flex flex-col items-center justify-center h-16 transition-colors duration-200 ease-in-out focus:outline-none rounded-lg
                  ${
                    isDisabled
                      ? 'text-zinc-600 cursor-not-allowed'
                      : isActive
                      ? 'text-white' // Active view icon
                      : 'text-zinc-400 hover:text-white' // Inactive view icons
                  }
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={isDisabled}
              >
                <span className="material-symbols-outlined text-2xl">
                  {item.icon}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

export default BottomNavigation;
