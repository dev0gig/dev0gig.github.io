import React, { useState, useEffect } from 'react';
import { useFwData } from '../hooks/useFwData';
import Icon from './Icon';

const AddMeterForm: React.FC = () => {
    const { addMeter, meterDraft, setMeterDraft } = useFwData();
    const [isOpen, setIsOpen] = useState(false);

    const [number, setNumber] = useState('');
    const [purpose, setPurpose] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        setNumber(meterDraft.number || '');
        setPurpose(meterDraft.purpose || '');
        setLocation(meterDraft.location || '');
    }, [meterDraft]);

    const handleInputChange = <K extends keyof typeof meterDraft>(key: K, value: string) => {
        setMeterDraft(prev => ({...prev, [key]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (number && purpose && location) {
            addMeter({ number, purpose, location });
            setMeterDraft({});
            setIsOpen(false);
        }
    };
    
    const isFormValid = number && purpose && location;

    return (
        <div className="bg-zinc-700/50 rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-3 flex justify-between items-center">
                <span className="font-semibold text-zinc-200">Neuen Zähler hinzufügen</span>
                <Icon name={isOpen ? 'expand_less' : 'expand_more'} />
            </button>
            {isOpen && (
                <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-600/50 space-y-3">
                    <div>
                        <label htmlFor="purpose" className="text-xs font-medium text-zinc-400">Zweck</label>
                        <input type="text" id="purpose" value={purpose} onChange={e => handleInputChange('purpose', e.target.value)} required className="mt-1 w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-sm" />
                    </div>
                     <div>
                        <label htmlFor="number" className="text-xs font-medium text-zinc-400">Zählernummer</label>
                        <input type="text" id="number" value={number} onChange={e => handleInputChange('number', e.target.value)} required className="mt-1 w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-sm" />
                    </div>
                     <div>
                        <label htmlFor="location" className="text-xs font-medium text-zinc-400">Ort</label>
                        <input type="text" id="location" value={location} onChange={e => handleInputChange('location', e.target.value)} required className="mt-1 w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-sm" />
                    </div>
                    <button type="submit" disabled={!isFormValid} className="w-full bg-violet-600 disabled:bg-zinc-600 text-white font-bold py-2 rounded-lg">
                        Hinzufügen
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddMeterForm;
