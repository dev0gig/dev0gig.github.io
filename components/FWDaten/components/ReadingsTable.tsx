import React, { useState, useRef, useEffect } from 'react';
import { Reading } from '../types';
import { useFwData } from '../hooks/useFwData';
import { useModal } from '../hooks/useModal';
import Icon from './Icon';

interface ReadingsTableProps {
    readings: Reading[];
}

const ReadingsTable: React.FC<ReadingsTableProps> = ({ readings }) => {
    const { updateReading, deleteReading, validateUpdatedReading } = useFwData();
    const { showModal } = useModal();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ date: string, value: string }>({ date: '', value: '' });
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId) {
            dateInputRef.current?.focus();
        }
    }, [editingId]);

    const handleEditStart = (reading: Reading) => {
        setEditingId(reading.id);
        setEditData({ date: reading.date, value: reading.value.toString().replace('.', ',') });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const handleSave = () => {
        if (!editingId) return;
        const numericValue = parseFloat(editData.value.replace(',', '.'));
        if (isNaN(numericValue)) return;
        
        const validation = validateUpdatedReading(editingId, editData.date, numericValue);
        if (!validation.isValid) {
            showModal({ title: 'Validierungsfehler', message: validation.error });
            return;
        }

        updateReading(editingId, { date: editData.date, value: numericValue });
        setEditingId(null);
    };

    const handleDelete = (reading: Reading) => {
        const formattedDate = new Date(reading.date).toLocaleDateString('de-DE');
        showModal({
            type: 'confirm',
            title: 'Eintrag löschen',
            message: `Möchten Sie den Zählerstand vom ${formattedDate} wirklich löschen?`,
            danger: true,
            confirmText: 'Löschen',
            onConfirm: () => deleteReading(reading.id)
        });
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitized = rawValue.replace(/[^0-9,]/g, '').replace(/,(.*?),/g, '$1,');
        setEditData({ ...editData, value: sanitized });
    };

    if (readings.length === 0) {
        return <div className="text-center text-zinc-500 py-8 bg-zinc-800/50 rounded-lg">Keine Zählerstände vorhanden.</div>;
    }

    return (
        <div className="overflow-x-auto bg-zinc-800/50 rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Datum</th>
                        <th scope="col" className="px-6 py-3">Zählerstand</th>
                        <th scope="col" className="px-6 py-3 text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {readings.map((reading) => (
                        <tr key={reading.id} className="border-b border-zinc-700">
                            {editingId === reading.id ? (
                                <>
                                    <td className="px-6 py-4">
                                        <input ref={dateInputRef} type="date" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} className="bg-zinc-900 border-zinc-600 rounded-md p-2 w-full" />
                                    </td>
                                    <td className="px-6 py-4">
                                         <input type="text" inputMode="decimal" value={editData.value} onChange={handleValueChange} className="bg-zinc-900 border-zinc-600 rounded-md p-2 w-full" />
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={handleSave} className="p-2 text-green-400 hover:bg-zinc-700 rounded-full"><Icon name="check" /></button>
                                        <button onClick={handleCancel} className="p-2 text-zinc-400 hover:bg-zinc-700 rounded-full"><Icon name="close" /></button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-4 font-medium text-zinc-200">{new Date(reading.date).toLocaleDateString('de-DE')}</td>
                                    <td className="px-6 py-4">{reading.value.toLocaleString('de-DE')}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditStart(reading)} className="p-2 text-zinc-400 hover:text-violet-400 hover:bg-zinc-700 rounded-full"><Icon name="edit" /></button>
                                        <button onClick={() => handleDelete(reading)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-full"><Icon name="delete" /></button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReadingsTable;
