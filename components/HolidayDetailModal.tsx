import React from 'react';

interface HolidayDetailModalProps {
    name: string;
    description: string;
    onClose: () => void;
}

const HolidayDetailModal: React.FC<HolidayDetailModalProps> = ({ name, description, onClose }) => {
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="holiday-modal-title"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 animate-fadeIn"
            onClick={onClose}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.15s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.15s ease-out forwards; }
            `}</style>
            <div
                className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-lg w-full max-w-xs m-4 p-5 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="holiday-modal-title" className="text-lg font-bold text-violet-300 mb-2">
                    {name}
                </h2>
                <p className="text-sm text-zinc-300">{description}</p>
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-zinc-700/50 active:bg-zinc-700/80 text-zinc-200 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    Schließen
                </button>
            </div>
        </div>
    );
};

export default HolidayDetailModal;
