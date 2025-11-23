
import React from 'react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  isEditing: boolean;
  onDelete: (url: string) => void;
  onEdit: (project: Project) => void;
  onToggleFavorite: (url: string) => void;
}

/**
 * Generiert eine deterministische HSL-Farbe aus einem String.
 * @param str Der Eingabestring (z.B. der Name des Lesezeichens).
 * @returns Einen HSL-Farbwert als String.
 */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = ((hash % 360) + 360) % 360; // ensure positive hue
  const s = 70; // saturation
  const l = 55; // fixed lightness for consistent brightness
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, isEditing, onDelete, onEdit, onToggleFavorite }) => {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const iconColor = stringToColor(project.name);

  return (
    <div className="relative group">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="h-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 flex items-center gap-3 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5"
      >
        <div
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md"
          style={{ backgroundColor: iconColor.replace('hsl', 'hsla').replace(')', ', 0.15)') }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: iconColor }}
          >
            {project.icon || 'public'}
          </span>
        </div>
        <h2 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
          {project.name}
        </h2>
      </a>
      {isEditing && (
        <div className="absolute top-1 right-1 flex gap-0.5 z-10">
          <button onClick={(e) => handleActionClick(e, () => onToggleFavorite(project.url))} className="p-1 rounded-full bg-black/30 hover:bg-slate-500/50 text-slate-400 hover:text-white transition-colors" title="Favorit">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${project.isFavorite ? 1 : 0}` }}>star</span>
          </button>
          <button onClick={(e) => handleActionClick(e, () => onEdit(project))} className="p-1 rounded-full bg-black/30 hover:bg-slate-500/50 text-slate-400 hover:text-white transition-colors" title="Bearbeiten">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onClick={(e) => handleActionClick(e, () => onDelete(project.url))} className="p-1 rounded-full bg-black/30 hover:bg-slate-500/50 text-slate-400 hover:text-white transition-colors" title="Löschen">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      )}
    </div>
  );
});
