

import React from 'react';
import { Tile, MyProject } from '../types';
import MetroTile from './MetroTile';

interface MetroViewProps {
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
  onReorderTiles: (newTiles: Tile[]) => void;
  projectDefinitions: Record<MyProject, { label: string; icon: string }>;
}

const MetroView: React.FC<MetroViewProps> = ({ 
    tiles, 
    onTileClick, 
    onReorderTiles, 
    projectDefinitions,
}) => {

  return (
    <div className="flex flex-col flex-grow overflow-y-auto">
      <header className="p-4 pt-6 sm:p-6 sm:pt-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-zinc-100">AxisMea</h1>
      </header>

      <div className="flex-grow p-2 sm:p-4 pt-0 sm:pt-0">
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gridAutoRows: '120px',
            gridAutoFlow: 'row dense',
           }}
        >
          {tiles.map(tile => (
            <div
              key={tile.id}
              onClick={() => onTileClick(tile)}
              className={`
                ${tile.size === '1x1' ? 'col-span-1 row-span-1' : ''}
                ${tile.size === '2x1' ? 'col-span-2 row-span-1' : ''}
                ${tile.size === '2x2' ? 'col-span-2 row-span-2' : ''}
                transition-opacity duration-200
              `}
            >
              <MetroTile 
                tile={tile} 
                projectDefinitions={projectDefinitions}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetroView;