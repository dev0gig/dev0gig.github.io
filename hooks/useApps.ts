

import { useState, useEffect } from 'react';
import { AppItem } from '../types';
import { apps as initialApps } from '../data/apps';

export const useApps = () => {
  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const savedApps = localStorage.getItem('axismea-apps');
      return savedApps ? JSON.parse(savedApps) : [...initialApps].sort((a, b) => a.ariaLabel.localeCompare(b.ariaLabel));
    } catch (error) {
      console.error("Error parsing apps from localStorage", error);
      return [...initialApps].sort((a, b) => a.ariaLabel.localeCompare(b.ariaLabel));
    }
  });

  useEffect(() => { localStorage.setItem('axismea-apps', JSON.stringify(apps)); }, [apps]);

  const handleSaveApp = (appData: Omit<AppItem, 'id' | 'isFavorite'>, id?: string) => {
    let updatedApps;
    if (id) { // Edit mode
      updatedApps = apps.map(app =>
        app.id === id ? { ...app, ...appData } : app
      );
    } else { // Add mode
      const newApp: AppItem = {
        id: appData.ariaLabel.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        ...appData,
        isFavorite: false,
      };
      updatedApps = [...apps, newApp];
    }
    const sortedApps = updatedApps.sort((a, b) => a.ariaLabel.localeCompare(b.ariaLabel));
    setApps(sortedApps);
  };

  const handleDeleteApp = (appId: string, callback?: () => void) => {
    setApps(prevApps => prevApps.filter(app => app.id !== appId));
    if (callback) callback();
  };

  const handleToggleFavorite = (appId: string, callback?: () => void) => {
    setApps(prevApps =>
      prevApps.map(app =>
        app.id === appId ? { ...app, isFavorite: !app.isFavorite } : app
      )
    );
    if (callback) callback();
  };

  return { apps, setApps, handleSaveApp, handleDeleteApp, handleToggleFavorite };
};