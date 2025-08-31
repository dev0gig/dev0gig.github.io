



import { useState, useEffect } from 'react';
import { Collection, GenericListItem } from '../types';
import { initialCollections } from '../data/collections';

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const savedCollections = localStorage.getItem('axismea-collections');
      if (savedCollections) {
        const parsed = JSON.parse(savedCollections) as Collection[];
        // No sort on load to preserve order
        return parsed;
      }
    } catch(error) { console.error("Error parsing collections from localStorage", error); }
    return [...initialCollections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  
  const handleReorderCollections = (reorderedCollections: Collection[]) => {
    setCollections(reorderedCollections);
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
  
  const handleReorderItems = (collectionId: string, reorderedItems: GenericListItem[]) => {
    setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, items: reorderedItems } : c
    ));
  };

  return {
    collections,
    setCollections,
    handleSaveCollection,
    handleDeleteCollection,
    handleReorderCollections,
    handleAddNewCollectionItem,
    handleUpdateCollectionItem,
    handleDeleteCollectionItem,
    handleReorderItems,
  };
};