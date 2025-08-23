



import React from 'react';
import { Tile, MyProject, ViewLinkTile } from '../types';
import DateTimeWidget from './DateTimeWidget';

interface MetroTileProps {
  tile: Tile;
  projectDefinitions: Record<MyProject, { label: string; icon: string }>;
}

const MetroTile: React.FC<MetroTileProps> = ({ 
    tile, 
    projectDefinitions, 
}) => {
  const isClickable = tile.type !== 'DATETIME';
  const cursorClass = isClickable ? 'cursor-pointer' : 'cursor-default';

  if (tile.type === 'DATETIME') {
    return (
        <div
            className={`relative w-full h-full p-2 rounded-lg text-white select-none transition-all duration-300 ease-in-out active:scale-[0.97] overflow-hidden ${tile.color} cursor-default`}
            role="region"
            aria-label="Datum und Uhrzeit Widget"
        >
            <DateTimeWidget />
        </div>
    );
  }


  const { icon, label } = (() => {
    switch (tile.type) {
      case 'MY_PROJECT':
        const project = projectDefinitions[tile.projectId];
        return { icon: project.icon, label: project.label };
      case 'EXTERNAL_PROJECT':
        return { icon: tile.project.icon, label: tile.project.name };
      case 'APP_LINK':
        return { icon: tile.app.iconUrl, label: tile.app.ariaLabel };
      case 'VIEW_LINK':
        const viewLinkTile = tile as ViewLinkTile;
        return { icon: viewLinkTile.icon, label: viewLinkTile.label };
      default:
        // Fallback for safety, though should not be reached with typed tiles
        return { icon: 'help', label: 'Unknown Tile' };
    }
  })();
  
  const projectTypeText = (() => {
    if (tile.type === 'MY_PROJECT') {
        return 'Intern';
    }
    if (tile.type === 'EXTERNAL_PROJECT') {
        return 'Extern';
    }
    return null;
  })();

  const isIconUrl = icon.startsWith('http');
  const isLargeTile = tile.size === '2x2';
  
  const iconSizeClass = isLargeTile ? 'text-6xl' : 'text-4xl';
  const imgSizeClass = isLargeTile ? 'w-16 h-16' : 'w-10 h-10';
  const titleSizeClass = isLargeTile ? 'text-lg' : '';

  return (
    <div
      className={`relative w-full h-full p-3 rounded-lg flex flex-col justify-between text-white select-none transition-all duration-300 ease-in-out active:scale-[0.97] overflow-hidden ${tile.color} ${cursorClass}`}
      role="button"
      aria-label={label}
    >
        {projectTypeText && (
            <div className="absolute top-2 right-2 text-xs font-bold text-white/80 bg-black/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm z-10">
                {projectTypeText}
            </div>
        )}
      {/* Top group: Icon */}
      <div>
        {isIconUrl ? (
          <img src={icon} alt="" className={`${imgSizeClass} object-cover rounded-md`} crossOrigin="anonymous"/>
        ) : (
          <span className={`material-symbols-outlined ${iconSizeClass}`}>
            {icon}
          </span>
        )}
      </div>

      {/* Bottom group: Title */}
      <h3 className={`font-bold leading-tight line-clamp-2 ${titleSizeClass}`}>{label}</h3>
    </div>
  );
};

export default MetroTile;