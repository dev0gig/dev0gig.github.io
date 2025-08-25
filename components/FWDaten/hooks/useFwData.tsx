import React, { createContext, useContext, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import { Meter, Reading } from '../types';

interface FwDataContextType {
    meters: Meter[];
    readings: Reading[];
    meterDraft: Partial<Meter>;
    readingDrafts: Record<string, Partial<Reading>>;
    addMeter: (meter: Omit<Meter, 'id'>) => void;
    updateMeter: (meterId: string, data: Partial<Omit<Meter, 'id'>>) => void;
    deleteMeter: (meterId: string) => void;
    addReading: (reading: Omit<Reading, 'id'>) => void;
    updateReading: (readingId: string, data: Partial<Reading>) => void;
    deleteReading: (readingId: string) => void;
    getReadingsForMeter: (meterId: string) => Reading[];
    validateNewReading: (meterId: string, date: string, value: number) => { isValid: boolean; error: string };
    validateUpdatedReading: (readingId: string, date: string, value: number) => { isValid: boolean; error: string };
    setMeterDraft: React.Dispatch<React.SetStateAction<Partial<Meter>>>;
    setReadingDraft: (meterId: string, draft: Partial<Reading>) => void;
    clearReadingDraft: (meterId: string) => void;
    exportData: () => string;
    importData: (jsonData: string) => { success: boolean, error?: string };
    deleteAllData: () => void;
}

const FwDataContext = createContext<FwDataContextType | null>(null);

export const FwDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [meters, setMeters] = useLocalStorage<Meter[]>('fw-data-meters', []);
    const [readings, setReadings] = useLocalStorage<Reading[]>('fw-data-readings', []);
    const [meterDraft, setMeterDraft] = useLocalStorage<Partial<Meter>>('fw-data-meter-draft', {});
    const [readingDrafts, setReadingDrafts] = useLocalStorage<Record<string, Partial<Reading>>>('fw-data-reading-drafts', {});

    const addMeter = (meterData: Omit<Meter, 'id'>) => {
        const newMeter: Meter = { id: `meter-${Date.now()}`, ...meterData };
        setMeters(prev => [...prev, newMeter]);
    };

    const updateMeter = (meterId: string, data: Partial<Omit<Meter, 'id'>>) => {
        setMeters(prev => prev.map(m => (m.id === meterId ? { ...m, ...data } : m)));
    };

    const deleteMeter = (meterId: string) => {
        setMeters(prev => prev.filter(m => m.id !== meterId));
        setReadings(prev => prev.filter(r => r.meterId !== meterId));
    };

    const getReadingsForMeter = (meterId: string) => {
        return readings.filter(r => r.meterId === meterId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const addReading = (readingData: Omit<Reading, 'id'>) => {
        const newReading: Reading = { id: `reading-${Date.now()}`, ...readingData };
        setReadings(prev => [...prev, newReading]);
    };

    const updateReading = (readingId: string, data: Partial<Reading>) => {
        setReadings(prev => prev.map(r => r.id === readingId ? { ...r, ...data } : r));
    };

    const deleteReading = (readingId: string) => {
        setReadings(prev => prev.filter(r => r.id !== readingId));
    };

    const validateNewReading = (meterId: string, date: string, value: number) => {
        const meterReadings = getReadingsForMeter(meterId);
        if (meterReadings.length === 0) return { isValid: true, error: '' };
        const lastReading = meterReadings[meterReadings.length - 1];
        if (new Date(date) <= new Date(lastReading.date)) {
            return { isValid: false, error: 'Das Datum muss nach der letzten Ablesung liegen.' };
        }
        if (value <= lastReading.value) {
            return { isValid: false, error: 'Der Zählerstand muss höher als der letzte sein.' };
        }
        return { isValid: true, error: '' };
    };
    
    const validateUpdatedReading = (readingId: string, date: string, value: number) => {
        const readingToUpdate = readings.find(r => r.id === readingId);
        if (!readingToUpdate) return { isValid: false, error: 'Eintrag nicht gefunden.'};

        const meterReadings = getReadingsForMeter(readingToUpdate.meterId);
        const currentIndex = meterReadings.findIndex(r => r.id === readingId);
        
        const prevReading = meterReadings[currentIndex - 1];
        const nextReading = meterReadings[currentIndex + 1];

        if (prevReading) {
            if (new Date(date) <= new Date(prevReading.date)) return { isValid: false, error: 'Datum muss nach dem vorherigen Eintrag liegen.' };
            if (value <= prevReading.value) return { isValid: false, error: 'Wert muss größer als der vorherige sein.' };
        }
        if (nextReading) {
            if (new Date(date) >= new Date(nextReading.date)) return { isValid: false, error: 'Datum muss vor dem nächsten Eintrag liegen.' };
            if (value >= nextReading.value) return { isValid: false, error: 'Wert muss kleiner als der nächste sein.' };
        }
        
        return { isValid: true, error: '' };
    };

    const setReadingDraft = (meterId: string, draft: Partial<Reading>) => {
        setReadingDrafts(prev => ({...prev, [meterId]: draft }));
    };

    const clearReadingDraft = (meterId: string) => {
        setReadingDrafts(prev => {
            const newDrafts = {...prev};
            delete newDrafts[meterId];
            return newDrafts;
        });
    };

    const exportData = () => {
        return JSON.stringify({ meters, readings }, null, 2);
    };

    const importData = (jsonData: string) => {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data.meters) && Array.isArray(data.readings)) {
                setMeters(data.meters);
                setReadings(data.readings);
                return { success: true };
            }
            return { success: false, error: 'Ungültige Datenstruktur.'};
        } catch (e) {
            return { success: false, error: 'Ungültige JSON-Datei.'};
        }
    };
    
    const deleteAllData = () => {
        setMeters([]);
        setReadings([]);
        setMeterDraft({});
        setReadingDrafts({});
    };

    const value = useMemo(() => ({
        meters,
        readings,
        meterDraft,
        readingDrafts,
        addMeter,
        updateMeter,
        deleteMeter,
        addReading,
        updateReading,
        deleteReading,
        getReadingsForMeter,
        validateNewReading,
        validateUpdatedReading,
        setMeterDraft,
        setReadingDraft,
        clearReadingDraft,
        exportData,
        importData,
        deleteAllData,
    }), [meters, readings, meterDraft, readingDrafts]);

    return <FwDataContext.Provider value={value}>{children}</FwDataContext.Provider>;
};

export const useFwData = () => {
    const context = useContext(FwDataContext);
    if (!context) {
        throw new Error('useFwData must be used within a FwDataProvider');
    }
    return context;
};