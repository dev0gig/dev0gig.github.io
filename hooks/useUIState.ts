import React, { useState } from 'react';

interface NotificationState {
  isOpen: boolean;
  type: 'info' | 'success' | 'error' | 'confirm';
  title: string;
  message: string | React.ReactNode;
  onConfirm?: () => void;
}

export const useUIState = () => {
    // Modal States
    const [backupModalState, setBackupModalState] = useState<{ isOpen: boolean; mode: 'export' | 'import' }>({ isOpen: false, mode: 'export' });
    
    // Notification Modal State
    const [notification, setNotification] = useState<NotificationState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
    });

    // --- Helper Functions ---
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    const showNotification = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setNotification({ isOpen: true, title, message, type, onConfirm: undefined });
    };

    const showConfirmation = (title: string, message: string | React.ReactNode, onConfirm: () => void) => {
        setNotification({ isOpen: true, title, message, type: 'confirm', onConfirm });
    };

    const closeAllPopups = () => {
        setBackupModalState({ isOpen: false, mode: 'export' });
        closeNotification();
    };
    
    return {
        backupModalState, setBackupModalState,
        notification,
        closeNotification,
        showNotification,
        showConfirmation,
        closeAllPopups,
    };
};