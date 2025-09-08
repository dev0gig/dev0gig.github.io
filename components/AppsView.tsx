


import React, { useState } from 'react';
import { AppItem } from '../types';
import ContextMenu from './ContextMenu';

interface AppsViewProps {
  apps: AppItem[];
  searchQuery: string;
  onContextMenu: (event: React.MouseEvent, app: AppItem) => void;
  isMobileView?: boolean;
  onBack?: () => void;
  onAddNew?: () => void;
}

const AppIcon: React.FC<{ app: AppItem; onContextMenu: (event: React.MouseEvent, app: AppItem) => void }> = ({ app, onContextMenu }) => (
    <a
        href={app.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={app.ariaLabel}
        className="flex flex-col items-center justify-start p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 focus:outline-none focus-visible:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-violet-500"
        onContextMenu={(e) => onContextMenu(e, app)}
    >
        <div className="aspect-square w-12 h-12 flex items-center justify-center mb-1.5 rounded-full bg-zinc-700 overflow-hidden">
            <img src={app.iconUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
        </div>
        <span className="text-xs text-center text-zinc-300 w-16 line-clamp-2 break-words">
            {app.ariaLabel}
        </span>
    </a>
);


const AppsView: React.FC<AppsViewProps> = ({ apps, searchQuery, onContextMenu, isMobileView = false, onBack, onAddNew }) => {
  const lowercasedQuery = searchQuery.toLowerCase();
  
  const filteredApps = apps.filter(app => 
    app.ariaLabel.toLowerCase().includes(lowercasedQuery)
  );
  
  const favorites = filteredApps.filter(app => app.isFavorite);
  const otherApps = filteredApps.filter(app => !app.isFavorite);

  const noResults = filteredApps.length === 0;
  const noAppsAtAll = apps.length === 0;

  return (
    <div className={`h-full flex flex-col ${isMobileView ? '' : ''}`}>
      {isMobileView && (
          <header className="flex items-center justify-between text-zinc-300 p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0 gap-x-2 flex-nowrap">
              {onBack && (
                  <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                      <span className="material-symbols-outlined">arrow_back</span>
                  </button>
              )}
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                  <span className="material-symbols-outlined text-3xl">apps</span>
                  <h1 className="text-2xl font-bold tracking-tight truncate">Apps</h1>
              </div>
                {onAddNew && (
                   <button
                    onClick={onAddNew}
                    className="flex items-center justify-center font-bold w-10 h-10 sm:w-auto sm:h-auto sm:py-2 sm:px-3 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 whitespace-nowrap flex-shrink-0"
                    aria-label="Neu"
                  >
                    <span className="material-symbols-outlined text-lg sm:mr-1">add_circle</span>
                    <span className="hidden sm:inline">Neu</span>
                  </button>
                )}
          </header>
      )}
      
      <div className={`flex-grow overflow-y-auto ${isMobileView ? 'p-4 sm:p-6 pt-0 sm:pt-2' : ''}`}>
        {noAppsAtAll ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">apps</span>
            <h2 className="text-2xl font-bold text-zinc-400">Keine Apps hinzugefügt</h2>
            <p className="mt-1 text-zinc-500 mb-6">Füge deine erste App hinzu, um loszulegen.</p>
            {onAddNew && (
              <button
                onClick={onAddNew}
                className="flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
              >
                <span className="material-symbols-outlined mr-2">add_circle</span>
                <span>Erste App hinzufügen</span>
              </button>
            )}
          </div>
        ) : noResults ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 pt-16">
            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">search_off</span>
            <h2 className="text-2xl font-bold text-zinc-400">Keine Apps gefunden</h2>
            <p className="mt-1 text-zinc-500">Für "{searchQuery}" gibt es keine Treffer.</p>
          </div>
        ) : (
          <>
            {favorites.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Angeheftet</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]">
                  {favorites.map(app => <AppIcon key={app.id} app={app} onContextMenu={onContextMenu} />)}
                </div>
              </section>
            )}
            {otherApps.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-zinc-100">Alle Apps</h2>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]">
                  {otherApps.map(app => <AppIcon key={app.id} app={app} onContextMenu={onContextMenu} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppsView;
