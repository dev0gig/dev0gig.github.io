import React, { useState, useEffect } from 'react';
import { useFwData } from '../hooks/useFwData';
import { useModal } from '../hooks/useModal';

interface AddReadingFormProps {
    meterId: string;
}

const AddReadingForm: React.FC<AddReadingFormProps> = ({ meterId }) => {
    const { addReading, validateNewReading, readingDrafts, setReadingDraft, clearReadingDraft } = useFwData();
    const { showModal } = useModal();
    
    const [date, setDate] = useState('');
    const [value, setValue] = useState('');

    useEffect(() => {
        const draft = readingDrafts[meterId] || {};
        setDate(draft.date || new Date().toISOString().split('T')[0]);
        setValue(draft.value ? String(draft.value).replace('.', ',') : '');
    }, [meterId, readingDrafts]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitized = rawValue.replace(/[^0-9,]/g, '').replace(/,(.*?),/g, '$1,');
        setValue(sanitized);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);
    };

    const updateDraft = () => {
        const numericValue = parseFloat(value.replace(',', '.'));
        setReadingDraft(meterId, {
            date,
            value: isNaN(numericValue) ? undefined : numericValue
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericValue = parseFloat(value.replace(',', '.'));
        if (!date || isNaN(numericValue)) return;

        const validation = validateNewReading(meterId, date, numericValue);
        if (!validation.isValid) {
            showModal({ title: 'Validierungsfehler', message: validation.error });
            return;
        }

        addReading({ meterId, date, value: numericValue });
        clearReadingDraft(meterId);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-800/50 p-4 rounded-lg flex flex-col md:flex-row items-end gap-4">
            <div className="flex-grow w-full">
                <label htmlFor="readingDate" className="text-sm font-medium text-zinc-300 mb-1 block">Datum</label>
                <input type="date" id="readingDate" value={date} onChange={handleDateChange} onBlur={updateDraft} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white" />
            </div>
             <div className="flex-grow w-full">
                <label htmlFor="readingValue" className="text-sm font-medium text-zinc-300 mb-1 block">Zählerstand</label>
                <input type="text" inputMode="decimal" id="readingValue" value={value} onChange={handleValueChange} onBlur={updateDraft} required placeholder="z.B. 12345,6" className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white" />
            </div>
            <button type="submit" className="w-full md:w-auto bg-violet-600 text-white font-bold py-2.5 px-6 rounded-lg">
                Speichern
            </button>
        </form>
    );
};

export default AddReadingForm;
