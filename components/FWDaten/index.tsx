
import React, { useState } from 'react';
import { FwDataProvider } from './hooks/useFwData';
import { ModalProvider } from './hooks/useModal';
import Header from './components/Header';
import MeterListView from './components/MeterListView';
import MeterDetailView from './components/MeterDetailView';
import Icon from './components/Icon';
import MeterFormModal from './components/MeterFormModal';
import { Meter } from './types';

interface FwDatenAppProps {
    isMobileView: boolean;
    onBack: () => void;
}

const FwDatenApp: React.FC<FwDatenAppProps> = ({ isMobileView, onBack }) => {
    const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
    const [editingMeter, setEditingMeter] = useState<Meter | null>(null);

    const handleMeterSelect = (id: string) => {
        setSelectedMeterId(id);
    };

    const handleEditMeter = (meter: Meter) => {
        setEditingMeter(meter);
    };
    
    const handleInternalBack = () => {
        // If a meter is selected, go back to the list view
        if (selectedMeterId) {
            setSelectedMeterId(null);
        } else if (isMobileView) {
            // Otherwise, on mobile, exit the FW-Daten app
            onBack();
        }
        // On desktop, the back button in the header is hidden, so no extra logic needed.
    };

    const renderContent = () => {
        if (isMobileView) {
            if (selectedMeterId) {
                // onBack for MeterDetailView is for internal navigation (e.g., after deletion)
                return <MeterDetailView meterId={selectedMeterId} onBack={() => setSelectedMeterId(null)} onEdit={handleEditMeter} />;
            }
            return <MeterListView onSelectMeter={handleMeterSelect} selectedMeterId={null} onEditMeter={handleEditMeter} isMobileView={isMobileView} />;
        }

        // Desktop Layout
        return (
            <div className="flex h-full w-full gap-6">
                <div className="w-1/3 max-w-sm flex-shrink-0">
                    <MeterListView onSelectMeter={handleMeterSelect} selectedMeterId={selectedMeterId} onEditMeter={handleEditMeter} isMobileView={isMobileView} />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {selectedMeterId ? (
                        <MeterDetailView meterId={selectedMeterId} onBack={() => setSelectedMeterId(null)} onEdit={handleEditMeter} />
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-lg bg-zinc-800/50">
                            <div className="text-center text-zinc-500">
                                <Icon name="west" className="text-4xl mb-2" />
                                <p className="font-semibold text-lg">Zähler auswählen</p>
                                <p>Wählen Sie einen Zähler aus der Liste aus, um Details anzuzeigen.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <FwDataProvider>
            <ModalProvider>
                <div className="flex flex-col h-full w-full bg-zinc-900 text-zinc-200 p-4">
                    <Header onBack={handleInternalBack} />
                    <div className="flex-grow pt-6 overflow-hidden">
                        {renderContent()}
                    </div>
                    <MeterFormModal
                        isOpen={!!editingMeter}
                        onClose={() => setEditingMeter(null)}
                        meterToEdit={editingMeter}
                    />
                </div>
            </ModalProvider>
        </FwDataProvider>
    );
};

export default FwDatenApp;
