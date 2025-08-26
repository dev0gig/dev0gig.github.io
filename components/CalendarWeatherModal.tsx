import React, { useState } from 'react';
import DetailedCalendar from './DetailedCalendar';
import DetailedWeather from './DetailedWeather';
import HolidayDetailModal from './HolidayDetailModal';

interface CalendarWeatherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface HolidayInfo {
    name: string;
    description: string;
}

const CalendarWeatherModal: React.FC<CalendarWeatherModalProps> = ({ isOpen, onClose }) => {
    const [holidayModalInfo, setHolidayModalInfo] = useState<HolidayInfo | null>(null);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
            `}</style>

            <div
                className="flex flex-col lg:flex-row items-center justify-center gap-8 p-4 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <DetailedCalendar onHolidayClick={setHolidayModalInfo} />
                <DetailedWeather />
            </div>

            {holidayModalInfo && (
                <HolidayDetailModal
                    name={holidayModalInfo.name}
                    description={holidayModalInfo.description}
                    onClose={() => setHolidayModalInfo(null)}
                />
            )}
        </div>
    );
};

export default CalendarWeatherModal;
