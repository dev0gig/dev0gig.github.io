import React, { useEffect } from 'react';
import Icon from './Icon';

export type NotificationType = 'info' | 'success' | 'warning' | 'danger';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: NotificationType;
    primaryButtonText?: string;
    onPrimaryButtonClick?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;
}

const typeConfig = {
    info: { icon: 'info', color: 'text-sky-400', button: 'bg-sky-500' },
    success: { icon: 'check_circle', color: 'text-green-400', button: 'bg-green-500' },
    warning: { icon: 'warning', color: 'text-amber-400', button: 'bg-amber-500' },
    danger: { icon: 'error', color: 'text-red-400', button: 'bg-red-500' },
};

const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen, onClose, title, message, type = 'info',
    primaryButtonText = 'OK', onPrimaryButtonClick,
    secondaryButtonText, onSecondaryButtonClick
}) => {

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const config = typeConfig[type];

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; } .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }`}</style>
            <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
                <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-zinc-700/50 mb-4 border-2 ${config.color.replace('text-', 'border-')}/30`}>
                    <Icon name={config.icon} className={`!text-4xl ${config.color}`} />
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mb-2">{title}</h2>
                <p className="text-sm text-zinc-300 mb-6">{message}</p>
                <div className="flex justify-center items-center gap-3 w-full">
                    {secondaryButtonText && (
                        <button onClick={onSecondaryButtonClick || onClose} className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-lg">
                            {secondaryButtonText}
                        </button>
                    )}
                    <button onClick={onPrimaryButtonClick || onClose} className={`flex-1 text-white font-bold py-2.5 px-4 rounded-lg ${config.button}`}>
                        {primaryButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
