
import { useState, useEffect } from 'react';
import { JournalEntry } from '../types';

export const useJournal = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const savedEntries = localStorage.getItem('axismea-journal');
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries) as JournalEntry[];
        return parsed.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (error) { console.error("Error parsing journal from localStorage", error); }
    return [];
  });

  useEffect(() => { localStorage.setItem('axismea-journal', JSON.stringify(journalEntries)); }, [journalEntries]);
  
  const handleAddNewJournalEntry = () => {
    const newEntry: JournalEntry = {
        id: `memo-${Date.now()}`,
        content: '',
        createdAt: new Date().toISOString(),
    };
    setJournalEntries(prevEntries => [newEntry, ...prevEntries]);
  };

  const handleUpdateJournalEntry = (id: string, content: string) => {
    setJournalEntries(prevEntries =>
        prevEntries.map(entry =>
            entry.id === id ? { ...entry, content: content } : entry
        )
    );
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  };
  
  return { journalEntries, setJournalEntries, handleAddNewJournalEntry, handleUpdateJournalEntry, handleDeleteJournalEntry };
};
