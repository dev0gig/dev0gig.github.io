import React from 'react';
import { useUIState } from '../hooks/useUIState';
import { useApps } from '../hooks/useApps';
import { useBookmarks } from '../hooks/useBookmarks';
import { useCollections } from '../hooks/useCollections';

import NotificationModal from './NotificationModal';
import AppFormModal from './AppFormModal';
import BookmarkFormModal from './BookmarkFormModal';
import CollectionFormModal from './CollectionFormModal';
import SettingsModal from './SettingsModal';
import BackupModal from './BackupModal';
import DeleteDataModal from './DeleteDataModal';
import ContextMenu from './ContextMenu';

interface GlobalModalsProps {
    ui: ReturnType<typeof useUIState>;
    data: {
        apps: ReturnType<typeof useApps>;
        bookmarks: ReturnType<typeof useBookmarks>;
        collections: ReturnType<typeof useCollections>;
    };
    isSettingsModalOpen: boolean;
    setIsSettingsModalOpen: (isOpen: boolean) => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (isOpen: boolean) => void;
    handleExportData: (scope: any) => void;
    handleImportData: (file: File) => void;
    handleDeleteAppData: (scope: any) => void;
    isDesktop: boolean;
}

const GlobalModals: React.FC<GlobalModalsProps> = ({
    ui,
    data,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleExportData,
    handleImportData,
    handleDeleteAppData,
    isDesktop,
}) => {
    return (
        <>
            <NotificationModal isOpen={ui.notification.isOpen} onClose={ui.closeNotification} title={ui.notification.title} message={ui.notification.message} type={ui.notification.type} onConfirm={ui.notification.onConfirm} />
            {ui.appFormModal.isOpen && <AppFormModal mode={ui.appFormModal.mode} app={ui.appFormModal.app} onClose={() => ui.setAppFormModal({ isOpen: false, mode: 'add' })} onSave={(appData, id) => { data.apps.handleSaveApp(appData, id); ui.closeAllPopups(); }} />}
            {ui.isBookmarkModalOpen && <BookmarkFormModal isOpen={ui.isBookmarkModalOpen} onClose={() => ui.setIsBookmarkModalOpen(false)} onSave={(url) => { data.bookmarks.handleAddNewBookmark(url); ui.setIsBookmarkModalOpen(false); }} />}
            {ui.collectionFormModal.isOpen && <CollectionFormModal mode={ui.collectionFormModal.mode} collection={ui.collectionFormModal.collection} onClose={() => ui.setCollectionFormModal({ isOpen: false, mode: 'add' })} onSave={(collectionData, id) => { data.collections.handleSaveCollection(collectionData, id); ui.closeAllPopups(); }} />}
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} onExportClick={() => { setIsSettingsModalOpen(false); ui.setBackupModalState({ isOpen: true, mode: 'export', scope: null }); }} onImportClick={() => { setIsSettingsModalOpen(false); ui.setBackupModalState({ isOpen: true, mode: 'import', scope: null }); }} onDeleteAllClick={() => { setIsSettingsModalOpen(false); setIsDeleteModalOpen(true); }} isDesktop={isDesktop} />}
            {ui.backupModalState.isOpen && <BackupModal mode={ui.backupModalState.mode} scope={ui.backupModalState.scope} onClose={() => ui.setBackupModalState({ isOpen: false, mode: 'export', scope: null })} onExport={handleExportData} onImport={handleImportData} />}
            <DeleteDataModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteAppData} />
            {ui.isAppContextMenuOpen && ui.selectedAppForMenu && (
                <ContextMenu
                    position={ui.appContextMenuPosition}
                    onClose={ui.closeAllPopups}
                    items={[
                        { label: 'Bearbeiten', icon: 'edit', onClick: () => ui.handleOpenEditModal(ui.selectedAppForMenu) },
                        { label: ui.selectedAppForMenu.isFavorite ? 'Lösen' : 'Anheften', icon: 'push_pin', onClick: () => data.apps.handleToggleFavorite(ui.selectedAppForMenu!.id, ui.closeAllPopups) },
                        { label: 'Löschen', icon: 'delete', onClick: () => ui.showConfirmation("App löschen?", "Möchten Sie diese App wirklich löschen?", () => data.apps.handleDeleteApp(ui.selectedAppForMenu!.id, ui.closeAllPopups)), className: 'bg-red-900/40 active:bg-red-900/60 text-red-300' },
                    ]}
                />
            )}
        </>
    );
};

export default GlobalModals;
