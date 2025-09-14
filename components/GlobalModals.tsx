import React from 'react';
import { useUIState } from '../hooks/useUIState';
import NotificationModal from './NotificationModal';
import SettingsModal from './SettingsModal';
import BackupModal from './BackupModal';
import DeleteDataModal from './DeleteDataModal';

interface GlobalModalsProps {
    ui: ReturnType<typeof useUIState>;
    isSettingsModalOpen: boolean;
    setIsSettingsModalOpen: (isOpen: boolean) => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (isOpen: boolean) => void;
    handleExportData: () => void;
    handleImportData: (file: File) => void;
    handleDeleteAppData: (scope: any) => void;
    handleExportMemoMeaAsMarkdown: () => void;
    isDesktop: boolean;
}

const GlobalModals: React.FC<GlobalModalsProps> = ({
    ui,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleExportData,
    handleImportData,
    handleDeleteAppData,
    handleExportMemoMeaAsMarkdown,
    isDesktop,
}) => {
    return (
        <>
            <NotificationModal isOpen={ui.notification.isOpen} onClose={ui.closeNotification} title={ui.notification.title} message={ui.notification.message} type={ui.notification.type} onConfirm={ui.notification.onConfirm} />
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} onExportClick={() => { setIsSettingsModalOpen(false); ui.setBackupModalState({ isOpen: true, mode: 'export' }); }} onImportClick={() => { setIsSettingsModalOpen(false); ui.setBackupModalState({ isOpen: true, mode: 'import' }); }} onDeleteAllClick={() => { setIsSettingsModalOpen(false); setIsDeleteModalOpen(true); }} isDesktop={isDesktop} />}
            {ui.backupModalState.isOpen && <BackupModal mode={ui.backupModalState.mode} onClose={() => ui.setBackupModalState({ isOpen: false, mode: 'export' })} onExport={handleExportData} onImport={handleImportData} onExportMemoMea={handleExportMemoMeaAsMarkdown} />}
            <DeleteDataModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteAppData} />
        </>
    );
};

export default GlobalModals;