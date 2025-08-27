


import React from 'react';
import { BookmarkItem } from '../types';

interface BookmarkItemCardProps {
  bookmark: BookmarkItem;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const BookmarkItemCard: React.FC<BookmarkItemCardProps> = ({ bookmark, onDelete, onToggleArchive }) => {
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

  const createHandler = (callback: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    callback(e);
  };

  const handleDelete = createHandler(() => onDelete(bookmark.id));
  const handleToggleArchive = createHandler(() => onToggleArchive(bookmark.id));

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex flex-col bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-md group transition-all duration-300 ease-in-out hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 overflow-hidden"
    >
      <div className="relative aspect-video w-full bg-zinc-700 flex items-center justify-center overflow-hidden">
        {bookmark.imageUrl ? (
          <img src={bookmark.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" crossOrigin="anonymous" />
        ) : (
          <span className="material-symbols-outlined text-5xl text-zinc-500">image_not_supported</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-zinc-100 text-base leading-tight line-clamp-2 mb-1" title={bookmark.title}>
          {bookmark.title}
        </h3>
        <p className="text-sm text-zinc-400 mt-auto truncate">{getHostname(bookmark.url)}</p>
      </div>
      
      <div className="absolute top-2 right-2 flex flex-col space-y-1 z-10">
        <button
          onClick={handleToggleArchive}
          className="text-zinc-300 bg-black/40 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-violet-500/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
          aria-label={bookmark.isArchived ? 'Dearchivieren' : 'Archivieren'}
          title={bookmark.isArchived ? 'Dearchivieren' : 'Archivieren'}
        >
          <span className="material-symbols-outlined text-lg leading-none" style={{ fontSize: '20px' }}>
            {bookmark.isArchived ? 'unarchive' : 'archive'}
          </span>
        </button>
        <button
          onClick={handleDelete}
          className="text-zinc-300 bg-black/40 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-red-500/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Lesezeichen löschen"
          title="Lesezeichen löschen"
        >
          <span className="material-symbols-outlined text-lg leading-none" style={{ fontSize: '20px' }}>delete</span>
        </button>
      </div>
    </a>
  );
};

export default BookmarkItemCard;