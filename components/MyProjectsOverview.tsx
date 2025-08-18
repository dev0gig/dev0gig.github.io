
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JournalEntry, BookmarkItem, MyProject, Collection } from '../types';

interface MyProjectsOverviewProps {
  journalEntries: JournalEntry[];
  bookmarks: BookmarkItem[];
  collections: Collection[];
  onProjectSelect: (project: MyProject) => void;
}

const MyProjectsOverview: React.FC<MyProjectsOverviewProps> = ({
  journalEntries,
  bookmarks,
  collections,
  onProjectSelect,
}) => {
  // MemoMea data
  const latestEntries = journalEntries.slice(0, 2);

  // ReadLateR data
  const activeBookmarks = bookmarks.filter(b => !b.isArchived);
  const latestBookmarks = activeBookmarks.slice(0, 2);
  const totalBookmarks = activeBookmarks.length;
  
  // CollMea data
  const totalCollections = collections.length;
  const latestCollections = collections.slice(0, 3);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .markdown-content {
           line-height: 1.6;
           color: #e4e4e7;
        }
        .markdown-content > *:first-child { margin-top: 0; }
        .markdown-content > *:last-child { margin-bottom: 0; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 600; margin-top: 0.5em; margin-bottom: 0.25em; color: #fafafa; }
        .markdown-content h1 { font-size: 1.25em; }
        .markdown-content h2 { font-size: 1.1em; }
        .markdown-content h3 { font-size: 1em; }
        .markdown-content p { margin-bottom: 0.5em; }
        .markdown-content a { color: #a78bfa; text-decoration: none; }
        .markdown-content a:hover { text-decoration: underline; }
        .markdown-content ul, .markdown-content ol { padding-left: 1.5rem; margin-bottom: 0.5em; }
        .markdown-content li { margin-bottom: 0.25em; }
        .markdown-content blockquote { border-left: 4px solid #52525b; padding-left: 1rem; margin-left: 0; font-style: italic; color: #a1a1aa; }
        .markdown-content code:not(pre > code) { background-color: rgba(82, 82, 91, 0.5); padding: 0.2em 0.4em; font-size: 85%; border-radius: 6px; }
        .markdown-content pre { background-color: #27272a; padding: 1rem; border-radius: 8px; overflow-x: auto; }
      `}</style>
      <header className="flex items-center space-x-3 text-zinc-300 mb-6">
        <span className="material-symbols-outlined text-4xl">dashboard</span>
        <h1 className="text-3xl font-bold tracking-tight">Projekte-Übersicht</h1>
      </header>

      <div className="space-y-6">
        {/* MemoMea Section */}
        <section
          role="button"
          tabIndex={0}
          aria-label="Gehe zu MemoMea"
          className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 shadow-md w-full relative group transition-all duration-300 active:border-zinc-600 active:bg-zinc-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
          onClick={() => onProjectSelect(MyProject.MemoMea)}
          onKeyDown={(e) => e.key === 'Enter' && onProjectSelect(MyProject.MemoMea)}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center text-zinc-400">
                    <span className="material-symbols-outlined mr-2">edit_note</span>
                    <h2 className="font-bold text-lg text-zinc-300">Letzte MemoMea Einträge</h2>
                </div>
            </div>
            {latestEntries.length > 0 ? (
                 <div className="space-y-3">
                    {latestEntries.map(entry => (
                        <div key={entry.id} className="bg-zinc-900/50 p-3 rounded-lg">
                            <p className="text-xs text-zinc-500 font-medium mb-1">
                                {new Date(entry.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                            <div className="markdown-content text-sm line-clamp-2 text-ellipsis overflow-hidden">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <p className="text-zinc-500 italic">Noch keine Einträge vorhanden.</p>
            )}
        </section>
        
        {/* CollMea Section */}
        <section
          role="button"
          tabIndex={0}
          aria-label="Gehe zu CollMea"
          className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 shadow-md w-full relative group transition-all duration-300 active:border-zinc-600 active:bg-zinc-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
          onClick={() => onProjectSelect(MyProject.CollMea)}
          onKeyDown={(e) => e.key === 'Enter' && onProjectSelect(MyProject.CollMea)}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center text-zinc-400">
                    <span className="material-symbols-outlined mr-2">collections_bookmark</span>
                    <h2 className="font-bold text-lg text-zinc-300">CollMea</h2>
                </div>
                <p className="text-sm text-zinc-400">{totalCollections} {totalCollections === 1 ? 'Sammlung' : 'Sammlungen'}</p>
            </div>
            {totalCollections > 0 ? (
                <div className="space-y-2 border-t border-zinc-700/60 pt-3">
                    {latestCollections.map(collection => (
                        <div key={collection.id} className="flex justify-between items-center text-sm bg-zinc-900/50 p-2 rounded-lg">
                            <div className="flex items-center overflow-hidden">
                                <span className="material-symbols-outlined mr-2.5 text-zinc-500">{collection.icon}</span>
                                <span className="text-zinc-300 font-medium truncate" title={collection.name}>{collection.name}</span>
                            </div>
                            <span className="text-zinc-400 flex-shrink-0 ml-2">
                                {collection.items.length} {collection.items.length === 1 ? 'Element' : 'Elemente'}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border-t border-zinc-700/60 pt-3">
                    <p className="text-zinc-500 italic">Noch keine Sammlungen vorhanden.</p>
                </div>
            )}
        </section>

        {/* ReadLateR Section */}
        <section
          role="button"
          tabIndex={0}
          aria-label="Gehe zu ReadLateR"
          className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 shadow-md w-full relative group transition-all duration-300 active:border-zinc-600 active:bg-zinc-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
          onClick={() => onProjectSelect(MyProject.ReadLateR)}
          onKeyDown={(e) => e.key === 'Enter' && onProjectSelect(MyProject.ReadLateR)}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center text-zinc-400">
                    <span className="material-symbols-outlined mr-2">bookmark</span>
                    <h2 className="font-bold text-lg text-zinc-300">ReadLateR</h2>
                </div>
                <p className="text-sm text-zinc-400">{totalBookmarks} Lesezeichen</p>
            </div>
            {latestBookmarks.length > 0 ? (
                <div className="space-y-2">
                    {latestBookmarks.map(bookmark => (
                        <div key={bookmark.id} className="bg-zinc-900/50 p-3 rounded-lg flex items-center space-x-3">
                            {bookmark.imageUrl ? (
                                <img src={bookmark.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" crossOrigin="anonymous" />
                            ) : (
                                <div className="w-10 h-10 rounded-md bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-zinc-500">link</span>
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="font-semibold text-zinc-200 truncate" title={bookmark.title}>{bookmark.title}</p>
                                <p className="text-xs text-zinc-500 truncate">{getHostname(bookmark.url)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-zinc-500 italic">Noch keine Lesezeichen vorhanden.</p>
            )}
        </section>

      </div>
    </div>
  );
};

export default MyProjectsOverview;