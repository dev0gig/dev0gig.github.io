import React, { useEffect } from 'react';

type NotificationType = 'info' | 'success' | 'error' | 'confirm';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  type: NotificationType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const typeDetails: Record<NotificationType, { icon: string; colorClass: string; confirmButtonClass: string; }> = {
  info: { icon: 'info', colorClass: 'text-sky-400', confirmButtonClass: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500' },
  success: { icon: 'check_circle', colorClass: 'text-green-400', confirmButtonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' },
  error: { icon: 'error', colorClass: 'text-red-400', confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' },
  confirm: { icon: 'help', colorClass: 'text-amber-400', confirmButtonClass: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500' },
};


const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  if (!isOpen) return null;

  const details = typeDetails[type];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={type !== 'confirm' ? onClose : undefined}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
      <div
        className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-zinc-700/50 mb-4 border-2 ${details.colorClass.replace('text-', 'border-')}/30`}>
          <span className={`material-symbols-outlined text-4xl ${details.colorClass}`}>{details.icon}</span>
        </div>
        
        <h2 id="notification-modal-title" className="text-xl font-bold text-zinc-100 mb-2">
          {title}
        </h2>
        
        <div className="text-sm text-zinc-300 mb-6 max-h-60 overflow-y-auto">
          {message}
        </div>
        
        <div className="flex justify-center items-center gap-3 w-full">
            {type === 'confirm' && (
                 <button
                    onClick={onClose}
                    className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-zinc-500"
                >
                    {cancelText}
                </button>
            )}
            <button
                onClick={handleConfirm}
                className={`flex-1 text-white font-bold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 ${details.confirmButtonClass}`}
            >
                {type === 'confirm' ? confirmText : 'OK'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;