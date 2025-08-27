import React from 'react';
import { useFwData } from '../hooks/useFwData';
import { useModal } from '../hooks/useModal';
import Icon from './Icon';
import AddReadingForm from './AddReadingForm';
import ReadingsChart from './ReadingsChart';
import ReadingsTable from './ReadingsTable';
import StatCard from './StatCard';
import { Meter } from '../types';

interface MeterDetailViewProps {
    meterId: string;
    onBack: () => void;
    onEdit: (meter: Meter) => void;
}

const MeterDetailView: React.FC<MeterDetailViewProps> = ({ meterId, onBack, onEdit }) => {
    const { meters, getReadingsForMeter, deleteMeter } = useFwData();
    const { showModal } = useModal();
    const meter = meters.find(m => m.id === meterId);
    const readings = getReadingsForMeter(meterId);

    if (!meter) {
        return <div className="p-4 text-center">Zähler nicht gefunden.</div>;
    }

    const lastReading = readings.length > 0 ? readings[readings.length - 1] : null;
    const secondLastReading = readings.length > 1 ? readings[readings.length - 2] : null;
    
    let consumptionSinceLast = 0;
    if (lastReading && secondLastReading) {
        consumptionSinceLast = lastReading.value - secondLastReading.value;
    }

    let daysSinceLastReading = 0;
    if (lastReading) {
        const timeDiff = new Date().getTime() - new Date(lastReading.date).getTime();
        daysSinceLastReading = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
    }


    const handleDeleteMeter = () => {
        showModal({
            type: 'confirm',
            title: 'Zähler löschen',
            message: `Möchten Sie den Zähler "${meter.purpose}" und alle zugehörigen ${readings.length} Zählerstände wirklich löschen?`,
            danger: true,
            confirmText: 'Zähler löschen',
            onConfirm: () => {
                deleteMeter(meterId);
                onBack();
            }
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100">{meter.purpose}</h2>
                    <p className="text-sm text-zinc-400">{meter.number} &bull; {meter.location}</p>
                </div>
                 <button
                    onClick={() => onEdit(meter)}
                    className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors -mt-1"
                    aria-label="Zähler bearbeiten"
                >
                    <Icon name="edit" />
                </button>
            </div>
            
            {/* Main Content - Scrollable */}
            <div className="flex-grow overflow-y-auto space-y-8 -mr-4 pr-4">
                 {/* Add Reading */}
                 <div>
                    <h3 className="text-lg font-semibold mb-3">Neuen Zählerstand erfassen</h3>
                    <AddReadingForm meterId={meterId} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard title="Verbrauch (letzte Periode)" value={consumptionSinceLast.toLocaleString('de-DE')} icon="local_fire_department" />
                    <StatCard title="Tage seit letzter Ablesung" value={daysSinceLastReading.toLocaleString('de-DE')} icon="update" />
                </div>

                {/* Chart */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Verbrauchsverlauf</h3>
                    <div className="h-64 bg-zinc-800/50 rounded-lg p-4">
                        <ReadingsChart readings={readings} />
                    </div>
                </div>
                
                {/* History */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Historie der Zählerstände</h3>
                    <ReadingsTable readings={readings} />
                </div>

                {/* Danger Zone */}
                <div className="mt-8">
                     <h3 className="text-lg font-semibold text-red-400 mb-3">Gefahrenzone</h3>
                     <div className="border border-red-500/50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-zinc-200">Zähler endgültig löschen</p>
                            <p className="text-sm text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                        </div>
                        <button onClick={handleDeleteMeter} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                            Löschen
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default MeterDetailView;