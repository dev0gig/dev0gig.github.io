
import { useState } from 'react';
import { View, MyProject, ExternalProjectItem, Tile } from '../types';

export const useNavigation = () => {
  const [activeView, setActiveView] = useState<View>(View.MyProjects);
  const [activeMyProject, setActiveMyProject] = useState<MyProject | null>(MyProject.MemoMea);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeExternalProjects, setActiveExternalProjects] = useState<{
    left: ExternalProjectItem | null;
    right: ExternalProjectItem | null;
  }>({ left: null, right: null });
  
  // State for mobile fullscreen content
  const [activeMobileContent, setActiveMobileContent] = useState<Tile | null>(null);
  
  const handleMyProjectSelect = (project: MyProject | null) => {
    setActiveCollectionId(null);
    setActiveExternalProjects({ left: null, right: null });
    setActiveMyProject(project);
    if (project) {
        setActiveView(View.MyProjects);
    }
  };
  
  const handleExternalProjectSelect = (project: ExternalProjectItem, position: 'left' | 'right' | 'full' = 'full', callback?: () => void) => {
    setActiveView(View.ExternalProjects);
    setActiveMyProject(null);

    if (position === 'full') {
      setActiveExternalProjects({ left: project, right: null });
    } else if (position === 'left') {
      setActiveExternalProjects(prev => ({ ...prev, left: project }));
    } else if (position === 'right') {
      setActiveExternalProjects(prev => ({ ...prev, right: project }));
    }
    if (callback) callback();
  };

  const handleCloseExternalProject = (position: 'left' | 'right') => {
    setActiveExternalProjects(prev => {
        const newProjects = { ...prev, [position]: null };
        if (!newProjects.left && !newProjects.right) {
            setActiveView(View.MyProjects);
            setActiveMyProject(MyProject.MemoMea);
        }
        return newProjects;
    });
  };

  const handleTileClick = (tile: Tile, callback?: () => void) => {
    if (tile.type === 'WEATHER' || tile.type === 'DATETIME') return;
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
    activeExternalProjects,
    setActiveExternalProjects,
    activeMobileContent,
    setActiveMobileContent,
    handleMyProjectSelect,
    handleExternalProjectSelect,
    handleCloseExternalProject,
    handleTileClick,
    handleCloseMobileContent,
  };
};
