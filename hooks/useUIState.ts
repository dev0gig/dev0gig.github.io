

import React, { useState } from 'react';
import { AppItem, Collection } from '../types';

interface NotificationState {
  isOpen: boolean;
  type: 'info' | 'success' | 'error' | 'confirm';
  title: string;
  message: string | React.ReactNode;
  onConfirm?: () => void;
}

export const useUIState = () => {
    // Modal States
    const [appFormModal, setAppFormModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; app?: AppItem; }>({ isOpen: false, mode: 'add' });
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [collectionFormModal, setCollectionFormModal] = useState<{ isOpen: boolean, mode: 'add' | 'edit', collection?: Collection }>({ isOpen: false, mode: 'add' });
    const [backupModalState, setBackupModalState] = useState<{ isOpen: boolean; mode: 'export' | 'import'; scope: 'all' | 'apps' | 'memo' | 'read' | 'coll' | 'auri' | 'memomd' | null }>({ isOpen: false, mode: 'export', scope: null });

    // Context Menu States
    const [isAppContextMenuOpen, setIsAppContextMenuOpen] = useState(false);
    const [appContextMenuPosition, setAppContextMenuPosition] = useState({ top: 0, left: 0 });
    const [selectedAppForMenu, setSelectedAppForMenu] = useState<AppItem | null>(null);
    
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
        setAppFormModal({ isOpen: false, mode: 'add' });
        setIsBookmarkModalOpen(false);
        setCollectionFormModal({ isOpen: false, mode: 'add' });
        setBackupModalState({ isOpen: false, mode: 'export', scope: null });
        setIsAppContextMenuOpen(false);
        setSelectedAppForMenu(null);
        closeNotification();
    };
    
    // --- Context Menu Handlers ---
    const handleAppContextMenu = (event: React.MouseEvent, app: AppItem) => {
        event.preventDefault();
        closeAllPopups();
        setSelectedAppForMenu(app);
        setAppContextMenuPosition({ top: event.clientY, left: event.clientX });
        setIsAppContextMenuOpen(true);
    };
    
    const handleOpenEditModal = (app: AppItem | null) => {
        if (!app) return;
        closeAllPopups();
        setAppFormModal({ isOpen: true, mode: 'edit', app });
    };

    return {
        appFormModal, setAppFormModal,
        isBookmarkModalOpen, setIsBookmarkModalOpen,
        collectionFormModal, setCollectionFormModal,
        backupModalState, setBackupModalState,
        isAppContextMenuOpen,
        appContextMenuPosition,
        selectedAppForMenu,
        notification,
        closeNotification,
        showNotification,
        showConfirmation,
        closeAllPopups,
        handleAppContextMenu,
        handleOpenEditModal,
    };
};