
import { useState, useEffect } from 'react';
import { Tile, MyProject, View, ViewLinkTile, DateTimeTile } from '../types';
import { externalProjects as externalProjectsData } from '../data/externalProjects';

const metroColors = [
    'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 
    'bg-rose-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-blue-600',
    'bg-green-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500'
];

export const useTiles = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    const generateInitialTiles = () => {
        let colorIndex = 0;
        const weatherTile: Tile = { id: 'weather-widget', type: 'WEATHER', size: '1x1', color: 'bg-sky-700', order: -2 };
        const dateTimeTile: DateTimeTile = { id: 'datetime-widget', type: 'DATETIME', size: '2x2', color: 'bg-zinc-700', order: -1 };
        const myProjectTiles: Tile[] = [
            { id: 'myproject-memomea', type: 'MY_PROJECT', projectId: MyProject.MemoMea, size: '2x2', color: 'bg-green-600', order: 0 },
            { id: 'myproject-readlater', type: 'MY_PROJECT', projectId: MyProject.ReadLateR, size: '2x1', color: 'bg-amber-500', order: 1 },
            { id: 'myproject-collmea', type: 'MY_PROJECT', projectId: MyProject.CollMea, size: '2x1', color: 'bg-sky-600', order: 2 },
        ];
        const externalProjectTiles: Tile[] = externalProjectsData.map((proj, index) => ({
            id: `external-${proj.name.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'EXTERNAL_PROJECT', project: proj, size: '1x1', color: metroColors[colorIndex++ % metroColors.length],
            order: myProjectTiles.length + index,
        }));
        
        const baseOrder = myProjectTiles.length + externalProjectTiles.length;
        const allAppsTile: ViewLinkTile = { id: 'viewlink-all-apps', type: 'VIEW_LINK', viewId: View.Apps, label: 'Alle Apps', icon: 'apps', size: '1x1', color: 'bg-zinc-700', order: baseOrder };
        
        const initialTiles = [weatherTile, dateTimeTile, ...myProjectTiles, ...externalProjectTiles, allAppsTile]
            .sort((a, b) => a.order - b.order)
            .map((t, i) => ({ ...t, order: i }));
        
        return initialTiles;
    };

    try {
        const savedTilesJSON = localStorage.getItem('axismea-tiles');
        if (savedTilesJSON) {
            let savedTiles: Tile[] = JSON.parse(savedTilesJSON);
            let tilesChanged = false;

            savedTiles = savedTiles.filter(t => t.type !== 'APP_LINK');
            
            if (!savedTiles.find(t => t.id === 'viewlink-all-apps')) {
                savedTiles.push({ id: 'viewlink-all-apps', type: 'VIEW_LINK', viewId: View.Apps, label: 'Alle Apps', icon: 'apps', size: '1x1', color: 'bg-zinc-700', order: 9997 });
                tilesChanged = true;
            }
            if (!savedTiles.find(t => t.type === 'WEATHER')) {
                savedTiles.unshift({ id: 'weather-widget', type: 'WEATHER', size: '1x1', color: 'bg-sky-700', order: -2 });
                tilesChanged = true;
            }
            if (!savedTiles.find(t => t.type === 'DATETIME')) {
                savedTiles.splice(1, 0, { id: 'datetime-widget', type: 'DATETIME', size: '2x2', color: 'bg-zinc-700', order: -1 });
                tilesChanged = true;
            } else {
                const dtTile = savedTiles.find(t => t.type === 'DATETIME')!;
                if (dtTile.size !== '2x2') {
                    dtTile.size = '2x2';
                    tilesChanged = true;
                }
            }

            const unicornMigrationFlag = 'axismea-unicorn-tile-migrated-v1';
            if (!localStorage.getItem(unicornMigrationFlag)) {
                const unicornTileIndex = savedTiles.findIndex(t => t.id === 'external-unicorn');
                if (unicornTileIndex > -1) {
                    const currentExternalTiles = savedTiles.filter(t => t.type === 'EXTERNAL_PROJECT');
                    if (currentExternalTiles.length > 0 && currentExternalTiles[currentExternalTiles.length - 1].id !== 'external-unicorn') {
                        const unicornTile = savedTiles[unicornTileIndex];
                        savedTiles[unicornTileIndex] = { ...unicornTile, order: currentExternalTiles[currentExternalTiles.length - 1].order + 0.5 };
                        tilesChanged = true;
                    }
                }
                localStorage.setItem(unicornMigrationFlag, 'true');
            }

            const finalTiles = savedTiles.sort((a,b) => a.order - b.order).map((t, i) => ({ ...t, order: i }));
            setTiles(finalTiles);

        } else {
            setTiles(generateInitialTiles());
        }
    } catch (e) {
        console.error("Failed to initialize tiles, resetting.", e);
        setTiles(generateInitialTiles());
    }
  }, []);

  useEffect(() => { 
    if (tiles.length > 0) {
        localStorage.setItem('axismea-tiles', JSON.stringify(tiles));
    }
  }, [tiles]);
 
  const handleReorderTiles = (newTiles: Tile[]) => {
    const reordered = newTiles.map((tile, index) => ({ ...tile, order: index }));
    setTiles(reordered);
  };
  
  return { tiles, setTiles, handleReorderTiles };
};
