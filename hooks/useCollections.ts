
import { useState, useEffect } from 'react';
import { Collection, GenericListItem } from '../types';

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const savedCollections = localStorage.getItem('axismea-collections');
      if (savedCollections) {
        const parsed = JSON.parse(savedCollections) as Collection[];
        return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch(error) { console.error("Error parsing collections from localStorage", error); }
    return [];
  });

  useEffect(() => { localStorage.setItem('axismea-collections', JSON.stringify(collections)); }, [collections]);

  const handleSaveCollection = (collectionData: { name: string; icon: string; }, id?: string) => {
    let updatedCollections;
    if (id) { // Edit
        updatedCollections = collections.map(c => c.id === id ? { ...c, ...collectionData } : c);
    } else { // Add
        const newCollection: Collection = {
            id: `coll-${Date.now()}`,
            ...collectionData,
            type: 'GenericList',
            createdAt: new Date().toISOString(),
            items: [],
        };
        updatedCollections = [newCollection, ...collections];
    }
    setCollections(updatedCollections);
  };

  const handleDeleteCollection = (id: string, callback?: () => void) => {
      setCollections(prev => prev.filter(c => c.id !== id));
      if (callback) callback();
  };

  const handleAddNewCollectionItem = (collectionId: string) => {
      const newItem: GenericListItem = {
          id: `item-${Date.now()}`,
          title: '',
          completed: false,
          createdAt: new Date().toISOString(),
      };
      setCollections(prev => prev.map(c => 
          c.id === collectionId ? { ...c, items: [newItem, ...c.items] } : c
      ));
  };
  
  const handleUpdateCollectionItem = (collectionId: string, updatedItem: GenericListItem) => {
    setCollections(prev => prev.map(c => {
        if (c.id === collectionId) {
            return {
                ...c,
                items: c.items.map(item => item.id === updatedItem.id ? updatedItem : item)
                             .sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1)
            };
        }
        return c;
    }));
  };
  
  const handleDeleteCollectionItem = (collectionId: string, itemId: string) => {
     setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, items: c.items.filter(item => item.id !== itemId) } : c
    ));
  };
  
  return {
    collections,
    setCollections,
    handleSaveCollection,
    handleDeleteCollection,
    handleAddNewCollectionItem,
    handleUpdateCollectionItem,
    handleDeleteCollectionItem,
  };
};
