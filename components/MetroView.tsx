

import React from 'react';
import { Tile, MyProject, ViewLinkTile, AppLinkTile, MyProjectTile } from '../types';

interface MetroViewProps {
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
  projectDefinitions: Record<MyProject, { label: string; icon: string }>;
  onOpenSettings: () => void;
}

const ListItem: React.FC<{
    icon: string;
    label: string;
    onClick: () => void;
}> = ({ icon, label, onClick }) => {
    const isIconUrl = icon.startsWith('http');

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center text-left p-4 bg-zinc-800/70 active:bg-zinc-800 rounded-lg transition-colors duration-200 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
        >
            {isIconUrl ? (
                <img src={icon} alt="" className="w-8 h-8 object-cover rounded-md mr-4 flex-shrink-0" crossOrigin="anonymous"/>
            ) : (
                <span className="material-symbols-outlined mr-4 text-zinc-400 text-2xl w-8 text-center flex-shrink-0">{icon}</span>
            )}
            <span className="font-medium flex-grow truncate">{label}</span>
            <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
        </button>
    );
};

const ListSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 px-4 sm:px-6">{title}</h2>
        <div className="space-y-2 px-2 sm:px-4">
            {children}
        </div>
    </section>
);

const MetroView: React.FC<MetroViewProps> = ({ tiles, onTileClick, projectDefinitions, onOpenSettings }) => {
    const myProjects = tiles.filter(t => t.type === 'MY_PROJECT') as MyProjectTile[];
    const apps = tiles.filter(t => t.type === 'VIEW_LINK' || t.type === 'APP_LINK') as (ViewLinkTile | AppLinkTile)[];

    return (
        <div className="flex flex-col flex-grow overflow-y-auto">
            <header className="p-4 pt-6 sm:p-6 sm:pt-8 flex-shrink-0 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-zinc-100">AxisMea</h1>
                <button 
                    onClick={onOpenSettings}
                    className="text-zinc-400 active:text-white transition-colors rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                    aria-label="Einstellungen öffnen"
                >
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </header>

            <div className="flex-grow py-4">
                {apps.length > 0 && (
                    <ListSection title="My Favorites">
                        {apps.map(tile => {
                            let icon, label;
                            if (tile.type === 'VIEW_LINK') {
                                icon = tile.icon;
                                label = tile.label;
                            } else { // APP_LINK
                                icon = tile.app.iconUrl;
                                label = tile.app.ariaLabel;
                            }
                            return (
                                <ListItem
                                    key={tile.id}
                                    icon={icon}
                                    label={label}
                                    onClick={() => onTileClick(tile)}
                                />
                            );
                        })}
                    </ListSection>
                )}
                
                {myProjects.length > 0 && (
                    <ListSection title="Tools">
                        {myProjects.map(tile => {
                            const project = projectDefinitions[tile.projectId];
                            return (
                                <ListItem
                                    key={tile.id}
                                    icon={project.icon}
                                    label={project.label}
                                    onClick={() => onTileClick(tile)}
                                />
                            );
                        })}
                    </ListSection>
                )}
            </div>
        </div>
    );
};

export default MetroView;