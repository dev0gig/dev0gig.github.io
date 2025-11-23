
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { BookmarkCard } from './components/BookmarkCard';
import { Spinner } from './components/Spinner';
import { EditModal } from './components/EditModal';
import { NotificationModal } from './components/NotificationModal';
import { SettingsModal } from './components/SettingsModal';
import { PROJECTS_DATA, BOOKMARKS_DATA } from './constants';
import type { Project } from './types';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookmarks, setBookmarks] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [googleSearchTerm, setGoogleSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [itemType, setItemType] = useState<'project' | 'bookmark' | null>(null);
  const [isCreditsOpen, setIsCreditsOpen] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actions?: { label: string; onClick: () => void; type: 'primary' | 'secondary' }[];
  }>({ isOpen: false, title: '', message: '' });


  const fileInputRef = useRef<HTMLInputElement>(null);

  // Register Service Worker for offline capabilities
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('✅ Service Worker registered successfully. Scope:', registration.scope);
          })
          .catch(error => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedProjects = localStorage.getItem('dashboard_projects');
        const savedBookmarks = localStorage.getItem('dashboard_bookmarks');

        const initialProjects = savedProjects ? JSON.parse(savedProjects) : PROJECTS_DATA;
        const initialBookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : BOOKMARKS_DATA;

        setProjects(initialProjects.sort((a: Project, b: Project) => a.name.localeCompare(b.name)));
        setBookmarks(initialBookmarks.sort((a: Project, b: Project) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setProjects([...PROJECTS_DATA].sort((a, b) => a.name.localeCompare(b.name)));
        setBookmarks([...BOOKMARKS_DATA].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setIsLoading(false);
    };

    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dashboard_projects', JSON.stringify(projects));
      localStorage.setItem('dashboard_bookmarks', JSON.stringify(bookmarks));
    }
  }, [projects, bookmarks, isLoading]);

  // --- Memoized Handlers for Performance ---

  const onToggleProject = useCallback((url: string) => {
    setProjects(prev => prev.map(item =>
      item.url === url ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  }, []);

  const onToggleBookmark = useCallback((url: string) => {
    setBookmarks(prev => prev.map(item =>
      item.url === url ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  }, []);

  const onDeleteProject = useCallback((url: string) => {
    if (confirm('Möchtest du dieses Element wirklich löschen?')) {
      setProjects(prev => prev.filter(p => p.url !== url));
    }
  }, []);

  const onDeleteBookmark = useCallback((url: string) => {
    if (confirm('Möchtest du dieses Element wirklich löschen?')) {
      setBookmarks(prev => prev.filter(b => b.url !== url));
    }
  }, []);

  const onEditProject = useCallback((item: Project) => {
    setEditingItem(item);
    setItemType('project');
    setIsModalOpen(true);
  }, []);

  const onEditBookmark = useCallback((item: Project) => {
    setEditingItem(item);
    setItemType('bookmark');
    setIsModalOpen(true);
  }, []);

  const onAddNewProject = useCallback(() => {
    setEditingItem(null);
    setItemType('project');
    setIsModalOpen(true);
  }, []);

  const onAddNewBookmark = useCallback(() => {
    setEditingItem(null);
    setItemType('bookmark');
    setIsModalOpen(true);
  }, []);

  const onClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleSave = (item: Project) => {
    const list = itemType === 'project' ? projects : bookmarks;
    const setter = itemType === 'project' ? setProjects : setBookmarks;

    if (editingItem) { // Editing existing item
      const updatedList = list.map(i => i.url === editingItem.url ? item : i);
      setter(updatedList.sort((a, b) => a.name.localeCompare(b.name)));
    } else { // Adding new item
      setter([...list, item].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setItemType(null);
  };

  const handleExport = () => {
    const dataToExport = {
      projects: projects,
      bookmarks: bookmarks,
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `dashboard-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCloseNotification = () => {
    setNotification({ isOpen: false, title: '', message: '' });
  };

  const handleConfirmImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const importedData = JSON.parse(text);
          if (Array.isArray(importedData.projects) && Array.isArray(importedData.bookmarks)) {
            setProjects(importedData.projects.sort((a: Project, b: Project) => a.name.localeCompare(b.name)));
            setBookmarks(importedData.bookmarks.sort((a: Project, b: Project) => a.name.localeCompare(b.name)));
            setIsEditing(false);
            setNotification({
              isOpen: true,
              title: 'Import Erfolgreich',
              message: 'Die Konfiguration wurde erfolgreich importiert.',
              actions: [{ label: 'Schließen', onClick: handleCloseNotification, type: 'primary' }]
            });
          } else {
            throw new Error('Invalid file format.');
          }
        }
      } catch (error) {
        console.error('Failed to import file:', error);
        setNotification({
          isOpen: true,
          title: 'Import Fehlgeschlagen',
          message: 'Fehler beim Importieren der Datei. Bitte stelle sicher, dass es eine gültige Export-Datei ist.',
          actions: [{ label: 'Schließen', onClick: handleCloseNotification, type: 'primary' }]
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setNotification({
      isOpen: true,
      title: 'Import Bestätigen',
      message: 'Möchtest du wirklich eine neue Konfiguration importieren? Deine aktuellen Daten werden überschrieben.',
      actions: [
        { label: 'Abbrechen', onClick: handleCloseNotification, type: 'secondary' },
        { label: 'Importieren', onClick: () => handleConfirmImport(file), type: 'primary' },
      ]
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const handleGoogleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && googleSearchTerm.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchTerm.trim())}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
      setGoogleSearchTerm('');
    }
  };

  const favoriteItems = useMemo(() =>
    [...projects, ...bookmarks].filter(item => item.isFavorite).sort((a, b) => a.name.localeCompare(b.name)),
    [projects, bookmarks]
  );

  const filteredBookmarks = useMemo(() =>
    bookmarks.filter(b => !b.isFavorite && b.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [bookmarks, searchTerm]
  );

  const regularProjects = useMemo(() =>
    projects.filter(p => !p.isFavorite),
    [projects]
  );

  // Create a Set of project URLs for O(1) lookup in the render loop
  const projectUrlSet = useMemo(() => new Set(projects.map(p => p.url)), [projects]);

  return (
    <div className="min-h-screen text-gray-100 p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="backdrop-blur-md bg-slate-500/20 hover:bg-slate-500/30 text-slate-200 hover:text-slate-100 border border-slate-500/30 rounded-full px-4 py-2 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
            <span>Bearbeitungsmodus verlassen</span>
          </button>
        )}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-full w-10 h-10 flex items-center justify-center transition-all"
          aria-label="Einstellungen öffnen"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      <div>
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 py-2">
            🏡⭐ My Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Schneller Zugriff auf meine Werkzeuge und Lesezeichen
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Spinner /></div>
        ) : (
          <main>
            {projects.length === 0 && bookmarks.length === 0 ? (
              <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                <span className="material-symbols-outlined text-6xl text-slate-500 mb-4">
                  space_dashboard
                </span>
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Dein Dashboard ist leer</h2>
                <p>Klicke oben rechts auf das <span className="font-bold">Zahnrad-Symbol</span> und aktiviere den Bearbeitungsmodus, um deine ersten Projekte und Lesezeichen hinzuzufügen.</p>
              </div>
            ) : (
              <>
                {favoriteItems.length > 0 && (
                  <section className="mb-10">
                    <h2 className="text-2xl font-bold text-slate-300 mb-6 border-b border-white/10 pb-3">⭐ Favoriten</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                      {favoriteItems.map(item => {
                        const isProject = projectUrlSet.has(item.url);
                        return isProject ? (
                          <ProjectCard
                            key={item.url}
                            project={item}
                            isEditing={isEditing}
                            onDelete={onDeleteProject}
                            onEdit={onEditProject}
                            onToggleFavorite={onToggleProject}
                          />
                        ) : (
                          <BookmarkCard
                            key={item.url}
                            bookmark={item}
                            isEditing={isEditing}
                            onDelete={onDeleteBookmark}
                            onEdit={onEditBookmark}
                            onToggleFavorite={onToggleBookmark}
                            onCardClick={onClearSearch}
                          />
                        )
                      })}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 2xl:grid-cols-6 gap-8">
                  <div className="lg:col-span-4 2xl:col-span-5">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                      <h2 className="text-2xl font-bold text-slate-300">Lesezeichen</h2>
                      <div className="flex items-center gap-3">
                        {/* Google Search Field */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Google Suche..."
                            value={googleSearchTerm}
                            onChange={(e) => setGoogleSearchTerm(e.target.value)}
                            onKeyDown={handleGoogleSearch}
                            className="bg-white/5 border border-white/10 rounded-md py-1.5 pl-8 pr-3 text-sm text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none w-64"
                          />
                          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </div>

                        {/* Existing Bookmark Search Field */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-md py-1.5 pl-8 pr-8 text-sm text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                          />
                          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">search</span>
                          {searchTerm && (
                            <button
                              onClick={onClearSearch}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                              aria-label="Suche löschen"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                      {filteredBookmarks.map((bookmark) => (
                        <BookmarkCard
                          key={bookmark.url}
                          bookmark={bookmark}
                          isEditing={isEditing}
                          onDelete={onDeleteBookmark}
                          onEdit={onEditBookmark}
                          onToggleFavorite={onToggleBookmark}
                          onCardClick={onClearSearch}
                        />
                      ))}
                      {isEditing && (
                        <button onClick={onAddNewBookmark} className="group backdrop-blur-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-lg p-3 flex items-center justify-center gap-3 transition-all duration-300 text-slate-400 hover:text-slate-200 hover:border-slate-200 min-h-[68px]">
                          <span className="material-symbols-outlined">add_circle</span>
                          <span className="text-sm font-medium">Neu</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <h2 className="text-2xl font-bold text-slate-300 mb-6 border-b border-white/10 pb-3">Meine Projekte</h2>
                    <div className="flex flex-col gap-4">
                      {regularProjects.map((project) => (
                        <ProjectCard
                          key={project.url}
                          project={project}
                          isEditing={isEditing}
                          onDelete={onDeleteProject}
                          onEdit={onEditProject}
                          onToggleFavorite={onToggleProject}
                        />
                      ))}
                      {isEditing && (
                        <button onClick={onAddNewProject} className="group backdrop-blur-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-lg p-3 flex items-center justify-center gap-3 transition-all duration-300 text-slate-400 hover:text-slate-200 hover:border-slate-200">
                          <span className="material-symbols-outlined">add_circle</span>
                          <span className="text-sm font-medium">Neues Projekt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        )}
      </div>



      {isModalOpen && (
        <EditModal
          isOpen={isModalOpen}
          item={editingItem}
          itemType={itemType}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing(!isEditing)}
        onImport={() => {
          setIsSettingsOpen(false);
          handleImportClick();
        }}
        onExport={() => {
          setIsSettingsOpen(false);
          handleExport();
        }}
        onShowCredits={() => {
          setIsSettingsOpen(false);
          setIsCreditsOpen(true);
        }}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        onClose={handleCloseNotification}
        actions={notification.actions}
      >
        <p>{notification.message}</p>
      </NotificationModal>

      <NotificationModal
        isOpen={isCreditsOpen}
        title="Credits"
        onClose={() => setIsCreditsOpen(false)}
        actions={[{ label: 'Schließen', onClick: () => setIsCreditsOpen(false), type: 'primary' }]}
      >
        <ul className="space-y-3 text-sm">
          <li>
            <div className="font-bold text-slate-200">Favicon/PWA Icon</div>
            <a
              href="https://www.flaticon.com/free-icons/house"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              House icons created by Freepik - Flaticon
            </a>
          </li>
          <li>
            <div className="font-bold text-slate-200">Global Font</div>
            <div>Ubuntu</div>
          </li>
          <li>
            <div className="font-bold text-slate-200">Icons</div>
            <div>Google Fonts Icons</div>
          </li>
          <li>
            <div className="font-bold text-slate-200">Website Creation</div>
            <div>Vibe Coding with Gemini AI</div>
          </li>
        </ul>
      </NotificationModal>
    </div>
  );
};

export default App;
