



import { useState } from 'react';
import { View, MyProject, Tile } from '../types';

export const useNavigation = () => {
  const [activeView, setActiveView] = useState<View>(View.MyProjects);
  const [activeMyProject, setActiveMyProject] = useState<MyProject | null>(MyProject.MemoMea);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // State for mobile fullscreen content
  const [activeMobileContent, setActiveMobileContent] = useState<Tile | null>(null);
  
  const handleMyProjectSelect = (project: MyProject | null) => {
    setActiveCollectionId(null);
    setActiveMyProject(project);
    if (project) {
        setActiveView(View.MyProjects);
    }
  };

  const handleTileClick = (tile: Tile, callback?: () => void) => {
    if (tile.type === 'DATETIME') return;
    if (tile.type === 'APP_LINK') {
      window.open(tile.app.targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveMobileContent(tile);
    if (callback) callback();
  };
  
  const handleCloseMobileContent = () => {
    setActiveMobileContent(null);
  };

  return {
    activeView,
    setActiveView,
    activeMyProject,
    setActiveMyProject,
    activeCollectionId,
    setActiveCollectionId,
    activeMobileContent,
    setActiveMobileContent,
    handleMyProjectSelect,
    handleTileClick,
    handleCloseMobileContent,
  };
};