
import { useState, useEffect } from 'react';
import { BookmarkItem } from '../types';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const savedBookmarks = localStorage.getItem('axismea-bookmarks');
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks);
        if (Array.isArray(parsed)) {
            return parsed
                .map(b => ({ ...b, isArchived: b.isArchived || false }))
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    } catch (error) { console.error("Error parsing bookmarks from localStorage", error); }
    return [];
  });
  
  const [readLaterShowArchived, setReadLaterShowArchived] = useState(false);

  useEffect(() => { localStorage.setItem('axismea-bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);

  const fetchBookmarkMetadata = async (id: string, url: string) => {
    try {
        const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`;
        const response = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Network response was not ok`);
        const data = await response.json();
        
        if (data.status !== 'success' || !data.data) throw new Error('Could not parse website metadata.');
        
        const metadata = data.data;
        const imageUrl = metadata.image?.url || metadata.screenshot?.url || metadata.logo?.url || '';
        const updatedData = { title: metadata.title || url, imageUrl };

        setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    } catch (error) {
        console.error(`Error fetching metadata for ${url}:`, error);
    }
  };
  
  const handleAddNewBookmark = (url: string) => {
    const newBookmark: BookmarkItem = {
        id: `bookmark-${Date.now()}`,
        url,
        title: url,
        imageUrl: '',
        createdAt: new Date().toISOString(),
        isArchived: false,
    };
    
    setBookmarks(prev => [newBookmark, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    fetchBookmarkMetadata(newBookmark.id, url);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };
  
  const handleToggleArchiveBookmark = (id: string) => {
    setBookmarks(prev =>
      prev.map(b =>
        b.id === id ? { ...b, isArchived: !b.isArchived } : b
      )
    );
  };

  return {
    bookmarks,
    setBookmarks,
    readLaterShowArchived,
    setReadLaterShowArchived,
    handleAddNewBookmark,
    handleDeleteBookmark,
    handleToggleArchiveBookmark
  };
};
