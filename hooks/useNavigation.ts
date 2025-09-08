
import { useState } from 'react';
import { View, MyProject, Tile } from '../types';

// Helper to validate the stored project from localStorage
const isValidMyProject = (project: any): project is MyProject => {
    return Object.values(MyProject).includes(project as MyProject);
};

export const useNavigation = () => {
  const [activeView, setActiveView] = useState<View>(View.MyProjects);
  
  // Initialize activeMyProject from localStorage or default to MemoMea
  const [activeMyProject, setActiveMyProject] = useState<MyProject | null>(() => {
    try {
        const lastProject = localStorage.getItem('axismea-lastActiveProject');
        if (lastProject && isValidMyProject(lastProject)) {
            return lastProject;
        }
    } catch (e) {
        console.error("Failed to read last active project from localStorage", e);
    }
    return MyProject.MemoMea; // Default project
  });

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // State for mobile fullscreen content
  const [activeMobileContent, setActiveMobileContent] = useState<Tile | null>(null);
  
  const handleMyProjectSelect = (project: MyProject | null) => {
    setActiveCollectionId(null);
    setActiveMyProject(project);
    try {
        if (project) {
            localStorage.setItem('axismea-lastActiveProject', project);
            setActiveView(View.MyProjects);
        } else {
            // If no project is selected (e.g. navigating to 'Apps'), remove the stored value.
            localStorage.removeItem('axismea-lastActiveProject');
        }
    } catch (e) {
        console.error("Failed to write to localStorage", e);
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
