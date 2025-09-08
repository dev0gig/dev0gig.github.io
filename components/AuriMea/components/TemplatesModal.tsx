import React from 'react';
import { useApp } from '../AuriMeaApp';
import Icon from './Icon';
import { TransactionTemplate } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TemplatesModalProps {
    onSelect: (template: TransactionTemplate) => void;
    isMobileView?: boolean;
    variant?: 'panel' | 'list';
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ onSelect, isMobileView, variant = 'panel' }) => {
    const { templates, deleteTemplate, showNotification, hideNotification } = useApp();

    const handleDelete = (e: React.MouseEvent, template: TransactionTemplate) => {
        e.stopPropagation();
        showNotification({
            title: 'Vorlage löschen',
            message: `Möchten Sie die Vorlage "${template.description}" wirklich löschen?`,
            type: 'danger',
            primaryButtonText: 'Löschen',
            onPrimaryButtonClick: () => {
                deleteTemplate(template.id);
                hideNotification();
            },
            secondaryButtonText: 'Abbrechen',
            onSecondaryButtonClick: hideNotification
        });
    };
    
    const listContent = (
        <>
            {templates.length > 0 ? (
                templates.map(template => (
                    <button 
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="group w-full text-left p-3 rounded-lg transition-colors bg-zinc-700/50 hover:bg-zinc-700 flex items-center"
                    >
                        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full mr-4 ${template.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            <Icon name={template.type === 'income' ? 'arrow_upward' : 'arrow_downward'} className="!text-lg" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className="font-medium truncate">{template.description}</p>
                            <p className="text-xs text-zinc-400">{template.category}</p>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                            <p className={`font-semibold ${template.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(template.amount)}
                            </p>
                        </div>
                        <div className="pl-2 flex-shrink-0">
                            <button
                                onClick={(e) => handleDelete(e, template)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 transition-opacity hover:bg-zinc-600 hover:text-red-400 ${isMobileView ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                aria-label="Vorlage löschen"
                            >
                                <Icon name="delete" className="!text-lg"/>
                            </button>
                        </div>
                    </button>
                ))
            ) : (
                <div className="text-center py-8 sm:py-16 text-zinc-500 h-full flex flex-col justify-center items-center">
                    <Icon name="receipt_long" className="!text-5xl mb-2" />
                    <h3 className="font-bold text-lg text-zinc-400">Keine Vorlagen</h3>
                    <p className="text-sm">Speichern Sie wiederkehrende Transaktionen als Vorlagen.</p>
                </div>
            )}
        </>
    );

    if (variant === 'list') {
        return (
            <div className="space-y-2">
                {listContent}
            </div>
        );
    }

    return (
        <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0 p-6 pb-0">
                <h2 className="text-xl font-bold">Vorlagen</h2>
            </div>

            <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-2 pt-4">
                {listContent}
            </div>
        </div>
    );
};

export default React.memo(TemplatesModal);
