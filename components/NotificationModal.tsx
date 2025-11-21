
import React from 'react';

interface ModalAction {
  label: string;
  onClick: () => void;
  type: 'primary' | 'secondary';
}

interface NotificationModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: ModalAction[];
}

const buttonStyles = {
  primary: 'px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors',
  secondary: 'px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-300 transition-colors',
};

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, title, onClose, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="text-slate-300 mb-6">
            {children}
        </div>
        {actions && actions.length > 0 && (
           <div className="mt-6 flex justify-end gap-3">
             {actions.map((action, index) => (
               <button
                 key={index}
                 type="button"
                 onClick={action.onClick}
                 className={buttonStyles[action.type]}
               >
                 {action.label}
               </button>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};
