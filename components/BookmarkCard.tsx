
import React, { useState } from 'react';
import type { Project } from '../types';

interface BookmarkCardProps {
  bookmark: Project;
  isEditing: boolean;
  onDelete: (url: string) => void;
  onEdit: (bookmark: Project) => void;
  onToggleFavorite: (url: string) => void;
  onCardClick?: () => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = React.memo(({ bookmark, isEditing, onDelete, onEdit, onToggleFavorite, onCardClick }) => {
  const [faviconError, setFaviconError] = useState(false);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${bookmark.url}`;

  return (
    <div className="relative group">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCardClick}
        className="h-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 flex items-center gap-3 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5"
      >
        {!faviconError ? (
          <img
            src={faviconUrl}
            alt={`Favicon für ${bookmark.name}`}
            aria-hidden="true"
            loading="lazy"
            className="w-8 h-8 flex-shrink-0 rounded-md object-contain"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-white/10">
            <span className="material-symbols-outlined text-xl text-slate-400">
              {bookmark.icon || 'public'}
            </span>
          </div>
        )}
        <h2 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
          {bookmark.name}
        </h2>
      </a>
      {isEditing && (
        <div className="absolute top-1 right-1 flex gap-0.5 z-10">
          <button onClick={(e) => handleActionClick(e, () => onToggleFavorite(bookmark.url))} className="p-1 rounded-full bg-black/30 hover:bg-slate-500/50 text-slate-400 hover:text-white transition-colors" title="Favorit">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${bookmark.isFavorite ? 1 : 0}` }}>star</span>
          </button>
          <button onClick={(e) => handleActionClick(e, () => onEdit(bookmark))} className="p-1 rounded-full bg-black/30 hover:bg-slate-500/50 text-slate-400 hover:text-white transition-colors" title="Bearbeiten">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onClick={(e) => handleActionClick(e, () => onDelete(bookmark.url))} className="p-1 rounded-full bg-black/30 hover:bg-slate-500/50 text-slate-400 hover:text-white transition-colors" title="Löschen">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      )}
    </div>
  );
});
