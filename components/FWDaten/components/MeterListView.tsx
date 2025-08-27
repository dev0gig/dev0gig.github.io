import React from 'react';
import { useFwData } from '../hooks/useFwData';
import { Reading, Meter } from '../types';
import AddMeterForm from './AddMeterForm';
import Icon from './Icon';

interface MeterListViewProps {
    onSelectMeter: (id: string) => void;
    selectedMeterId: string | null;
    onEditMeter: (meter: Meter) => void;
}

const calculateConsumption = (readings: Reading[]) => {
    if (readings.length < 2) return 0;
    const sorted = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[sorted.length - 1].value - sorted[0].value;
};

const MeterListView: React.FC<MeterListViewProps> = ({ onSelectMeter, selectedMeterId, onEditMeter }) => {
    const { meters, getReadingsForMeter } = useFwData();

    const allReadingsByMeter = meters.map(meter => getReadingsForMeter(meter.id));
    const totalConsumption = allReadingsByMeter.reduce((sum, meterReadings) => sum + calculateConsumption(meterReadings), 0);
    
    return (
        <div className="flex flex-col h-full bg-zinc-800/50 rounded-lg p-4">
            <div className="flex-shrink-0 mb-4">
                <div className="bg-zinc-900/70 p-4 rounded-lg text-center">
                    <p className="text-sm font-medium text-zinc-400">Gesamtverbrauch (Alle Zähler)</p>
                    <p className="text-3xl font-bold text-violet-400 mt-1">{totalConsumption.toLocaleString('de-DE')}</p>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-3">
                {meters.length === 0 ? (
                     <div className="text-center text-zinc-500 pt-10">
                        <Icon name="info" className="text-3xl mb-2" />
                        <p>Noch keine Zähler angelegt.</p>
                    </div>
                ) : (
                    meters.map(meter => {
                        const meterReadings = getReadingsForMeter(meter.id);
                        const consumption = calculateConsumption(meterReadings);
                        const isActive = selectedMeterId === meter.id;

                        return (
                            <div key={meter.id} className="relative group">
                                <button
                                    onClick={() => onSelectMeter(meter.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${
                                        isActive ? 'bg-violet-500/20 border-violet-500' : 'bg-zinc-700/50 hover:bg-zinc-700 border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="pr-8">
                                            <p className="font-bold text-zinc-100">{meter.purpose}</p>
                                            <p className="text-xs text-zinc-400">{meter.number} &bull; {meter.location}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <p className="font-semibold text-zinc-200">{consumption.toLocaleString('de-DE')}</p>
                                            <p className="text-xs text-zinc-500">Verbrauch</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditMeter(meter); }}
                                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-zinc-400 bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-zinc-600 hover:text-white"
                                    aria-label="Zähler bearbeiten"
                                >
                                    <Icon name="edit" className="!text-lg" />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="flex-shrink-0 mt-4">
                <AddMeterForm />
            </div>
        </div>
    );
};

export default MeterListView;