import React, { useState, useCallback, useContext, createContext } from 'react';
import Icon from '../components/Icon';

interface ModalOptions {
    title: string;
    message: React.ReactNode;
    type?: 'alert' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    danger?: boolean;
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

    const showModal = useCallback((options: ModalOptions) => {
        setModalOptions({ type: 'alert', ...options });
    }, []);

    const hideModal = useCallback(() => {
        setModalOptions(null);
    }, []);

    const handleConfirm = () => {
        if (modalOptions?.onConfirm) {
            modalOptions.onConfirm();
        }
        hideModal();
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {modalOptions && (
                 <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
                    onClick={hideModal}
                >
                    <div
                        className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full max-w-sm m-4 p-6 animate-scaleIn flex flex-col items-center text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {modalOptions.danger && (
                             <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/40 mb-4 border-2 border-red-500/30">
                                <Icon name="warning" className="text-4xl text-red-400" />
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-zinc-100 mb-2">{modalOptions.title}</h2>
                        <div className="text-sm text-zinc-300 mb-6">{modalOptions.message}</div>
                        <div className="flex justify-center items-center gap-3 w-full">
                            {modalOptions.type === 'confirm' && (
                                <button onClick={hideModal} className="flex-1 bg-zinc-600 active:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-lg">
                                    {modalOptions.cancelText || 'Abbrechen'}
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 text-white font-bold py-2.5 px-4 rounded-lg transition-colors ${
                                    modalOptions.danger ? 'bg-red-600 active:bg-red-700' : 'bg-violet-600 active:bg-violet-700'
                                }`}
                            >
                                {modalOptions.confirmText || 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};
