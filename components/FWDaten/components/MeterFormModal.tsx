import React, { useState, useEffect } from 'react';
import { useFwData } from '../hooks/useFwData';
import { Meter } from '../types';
import Icon from './Icon';

interface MeterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    meterToEdit: Meter | null;
}

const MeterFormModal: React.FC<MeterFormModalProps> = ({ isOpen, onClose, meterToEdit }) => {
    const { updateMeter } = useFwData();
    const [number, setNumber] = useState('');
    const [purpose, setPurpose] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        if (meterToEdit) {
            setNumber(meterToEdit.number);
            setPurpose(meterToEdit.purpose);
            setLocation(meterToEdit.location);
        }
    }, [meterToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (meterToEdit && number && purpose && location) {
            updateMeter(meterToEdit.id, { number, purpose, location });
            onClose();
        }
    };
    
    const isFormValid = number && purpose && location;
    
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
            `}</style>
            <div
                className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-100">Zähler bearbeiten</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 active:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500"
                        aria-label="Modal schließen"
                    >
                        <Icon name="close" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-purpose" className="block text-sm font-medium text-zinc-300 mb-1">Zweck</label>
                        <input type="text" id="edit-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                        <label htmlFor="edit-number" className="block text-sm font-medium text-zinc-300 mb-1">Zählernummer</label>
                        <input type="text" id="edit-number" value={number} onChange={(e) => setNumber(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                        <label htmlFor="edit-location" className="block text-sm font-medium text-zinc-300 mb-1">Ort</label>
                        <input type="text" id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={!isFormValid} className="w-full bg-violet-600 active:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-violet-500">
                            Änderungen speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeterFormModal;
