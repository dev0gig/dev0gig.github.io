
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { BookmarkCard } from './components/BookmarkCard';
import { Spinner } from './components/Spinner';
import { EditModal } from './components/EditModal';
import { NotificationModal } from './components/NotificationModal';
import { PROJECTS_DATA, BOOKMARKS_DATA } from './constants';
import type { Project } from './types';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookmarks, setBookmarks] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [itemType, setItemType] = useState<'project' | 'bookmark' | null>(null);

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
        {isEditing && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-cyan-400 rounded-full p-2 transition-all"
              aria-label="Konfiguration importieren"
              title="Importieren"
            >
              <span className="material-symbols-outlined">upload</span>
            </button>
            <button
              onClick={handleExport}
              className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-cyan-400 rounded-full p-2 transition-all"
              aria-label="Konfiguration exportieren"
              title="Exportieren"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
          </>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-cyan-400 rounded-full p-2 transition-all"
          aria-label={isEditing ? 'Bearbeitungsmodus beenden' : 'Bearbeitungsmodus starten'}
        >
          <span className="material-symbols-outlined">{isEditing ? 'done' : 'edit'}</span>
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
                <p>Klicke oben rechts auf den <span className="font-bold">Bearbeiten-Button</span>, um deine ersten Projekte und Lesezeichen hinzuzufügen.</p>
              </div>
            ) : (
              <>
                {favoriteItems.length > 0 && (
                  <section className="mb-10">
                    <h2 className="text-2xl font-bold text-slate-300 mb-6 border-b border-white/10 pb-3">⭐ Favoriten</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Suchen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-md py-1.5 pl-8 pr-8 text-sm text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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
                        <button onClick={onAddNewBookmark} className="group backdrop-blur-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-lg p-3 flex items-center justify-center gap-3 transition-all duration-300 text-slate-400 hover:text-cyan-400 hover:border-cyan-400 min-h-[68px]">
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
                        <button onClick={onAddNewProject} className="group backdrop-blur-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-lg p-3 flex items-center justify-center gap-3 transition-all duration-300 text-slate-400 hover:text-cyan-400 hover:border-cyan-400">
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

      <footer className="mt-12 py-6 text-center border-t border-white/10">
        <p className="text-slate-400 text-sm">
          <a
            href="https://www.flaticon.com/free-icons/house"
            title="house icons"
            className="hover:text-cyan-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            House icons created by Freepik - Flaticon
          </a>
        </p>
      </footer>

      {isModalOpen && (
        <EditModal
          isOpen={isModalOpen}
          item={editingItem}
          itemType={itemType}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        onClose={handleCloseNotification}
        actions={notification.actions}
      >
        <p>{notification.message}</p>
      </NotificationModal>
    </div>
  );
};

export default App;
