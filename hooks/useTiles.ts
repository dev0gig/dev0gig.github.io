
import { useState, useEffect } from 'react';
import { Tile, MyProject, View, DateTimeTile } from '../types';

export const useTiles = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    const generateInitialTiles = () => {
        const dateTimeTile: DateTimeTile = { id: 'datetime-widget', type: 'DATETIME', size: '2x2', color: 'bg-zinc-700', order: -1 };
        const myProjectTiles: Tile[] = [
            { id: 'myproject-memomea', type: 'MY_PROJECT', projectId: MyProject.MemoMea, size: '2x2', color: 'bg-green-600', order: 0 },
            { id: 'myproject-aurimea', type: 'MY_PROJECT', projectId: MyProject.AuriMea, size: '2x2', color: 'bg-indigo-600', order: 1 },
        ];
        
        const initialTiles = [dateTimeTile, ...myProjectTiles]
            .sort((a, b) => a.order - b.order)
            .map((t, i) => ({ ...t, order: i }));
        
        return initialTiles;
    };

    try {
        const savedTilesJSON = localStorage.getItem('axismea-tiles');
        if (savedTilesJSON) {
            let savedTiles: Tile[] = JSON.parse(savedTilesJSON);

            // Filter out old tiles from previous versions
            const validProjectIds = Object.values(MyProject);
            savedTiles = savedTiles.filter(t => {
                if (t.type === 'MY_PROJECT') {
                    return validProjectIds.includes(t.projectId);
                }
                return t.type === 'DATETIME';
            });
            
            if (!savedTiles.find(t => t.type === 'DATETIME')) {
                savedTiles.splice(1, 0, { id: 'datetime-widget', type: 'DATETIME', size: '2x2', color: 'bg-zinc-700', order: -1 });
            }
            if (!savedTiles.find(t => t.id === 'myproject-memomea')) {
                 savedTiles.push({ id: 'myproject-memomea', type: 'MY_PROJECT', projectId: MyProject.MemoMea, size: '2x2', color: 'bg-green-600', order: 9998 });
            }
            if (!savedTiles.find(t => t.id === 'myproject-aurimea')) {
                 savedTiles.push({ id: 'myproject-aurimea', type: 'MY_PROJECT', projectId: MyProject.AuriMea, size: '2x2', color: 'bg-indigo-600', order: 9999 });
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
