

import React from 'react';
import { Tile, MyProject } from '../types';
import MetroView from './MetroView';

interface MobileLayoutProps {
  children: React.ReactNode;
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
  activeMobileContent: Tile | null;
  projectDefinitions: Record<MyProject, { label: string; icon: string }>;
  onOpenSettings: () => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
    children,
    tiles,
    onTileClick,
    activeMobileContent,
    projectDefinitions,
    onOpenSettings,
}) => {
  return (
    <div className="bg-zinc-900 text-zinc-100 h-full antialiased flex flex-col">
      {activeMobileContent ? (
        <div className="relative flex-grow overflow-hidden">
            <main className="h-full overflow-y-auto">
                {children}
            </main>
        </div>
      ) : (
        <MetroView
          tiles={tiles}
          onTileClick={onTileClick}
          projectDefinitions={projectDefinitions}
          onOpenSettings={onOpenSettings}
        />
      )}
    </div>
  );
};

export default MobileLayout;