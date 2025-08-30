
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Flashcard, FlashcardDeck } from '../types';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';
import CardFormModal from './CardFormModal';

interface FlashcardsViewProps {
    isMobileView?: boolean;
    onBack?: () => void;
    showNotification: (title: string, message: string | React.ReactNode, type?: 'info' | 'success' | 'error') => void;
    showConfirmation: (title: string, message: string | React.ReactNode, onConfirm: () => void) => void;
    deck: FlashcardDeck;
    setDeck: (deck: FlashcardDeck) => void;
    deckName: string;
    setDeckName: (name: string) => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ isMobileView = false, onBack, showNotification, showConfirmation, deck, setDeck, deckName, setDeckName }) => {
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFrontFirst, setIsFrontFirst] = useState(true);
    const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCardListVisible, setIsCardListVisible] = useState(false);
    const [listSearchQuery, setListSearchQuery] = useState('');
    const [isCardFormModalOpen, setIsCardFormModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<{ card: Flashcard, index: number } | null>(null);

    const shuffleArray = (array: number[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    
    const startDeck = useCallback((newDeck: FlashcardDeck, name?: string) => {
        setDeck(newDeck);
        if (name) {
            setDeckName(name);
        }
        if (newDeck.length > 0) {
            const indices = newDeck.map((_, i) => i);
            const newShuffledIndices = shuffleArray(indices);
            const firstIndex = newShuffledIndices.pop() ?? null;
            setShuffledIndices(newShuffledIndices);
            setCurrentIndex(firstIndex);
        } else {
            setShuffledIndices([]);
            setCurrentIndex(null);
        }
        setIsFlipped(false);
        drawingCanvasRef.current?.clearCanvas();
    }, [setDeck, setDeckName]);
    
    useEffect(() => {
        // This effect runs when the component mounts or when the deck from props changes.
        // It initializes or resets the learning session.
        if (deck.length > 0) {
             const indices = deck.map((_, i) => i);
            const newShuffledIndices = shuffleArray(indices);
            const firstIndex = newShuffledIndices.pop() ?? null;
            setShuffledIndices(newShuffledIndices);
            setCurrentIndex(firstIndex);
        } else {
            setShuffledIndices([]);
            setCurrentIndex(null);
        }
    }, [deck]);


    const handleNextCard = () => {
        if (shuffledIndices.length === 0) {
            if (deck.length > 0) {
                showNotification('Deck beendet', 'Alle Karten wurden angezeigt. Das Deck wird neu gemischt.', 'info');
                const indices = deck.map((_, i) => i);
                const newShuffledIndices = shuffleArray(indices);
                const nextIndex = newShuffledIndices.pop() ?? null;
                setShuffledIndices(newShuffledIndices);
                setCurrentIndex(nextIndex);
            } else {
                 showNotification('Deck leer', 'Es sind keine Karten im Deck zum Lernen vorhanden.', 'info');
                 return;
            }
        } else {
            const newShuffled = [...shuffledIndices];
            const nextIndex = newShuffled.pop() ?? null;
            setShuffledIndices(newShuffled);
            setCurrentIndex(nextIndex);
        }
        setIsFlipped(false);
        drawingCanvasRef.current?.clearCanvas();
    };

    const handleJumpToCard = (cardIndex: number) => {
        setCurrentIndex(cardIndex);
        setShuffledIndices(prev => prev.filter(i => i !== cardIndex));
        setIsFlipped(false);
        drawingCanvasRef.current?.clearCanvas();
        setIsCardListVisible(false);
        setListSearchQuery('');
    };
    
    const handleOpenAddModal = () => {
        setEditingCard(null);
        setIsCardFormModalOpen(true);
    };

    const handleOpenEditModal = (card: Flashcard, index: number) => {
        setEditingCard({ card, index });
        setIsCardFormModalOpen(true);
    };

    const handleSaveCard = (cardData: Flashcard) => {
        let newDeck;
        if (editingCard) { // Edit mode
            newDeck = [...deck];
            newDeck[editingCard.index] = cardData;
            showNotification('Erfolg', 'Karte wurde erfolgreich aktualisiert.', 'success');
        } else { // Add mode
            newDeck = [...deck, cardData];
            showNotification('Erfolg', 'Neue Karte wurde hinzugefügt.', 'success');
        }
        setDeck(newDeck);
        setIsCardFormModalOpen(false);
        setEditingCard(null);
    };

    const handleDeleteCard = (indexToDelete: number) => {
        const cardToDelete = deck[indexToDelete];
        showConfirmation(
            'Karte löschen?',
            `Möchten Sie die Karte "${cardToDelete.front}" wirklich unwiderruflich löschen?`,
            () => {
                const newDeck = deck.filter((_, i) => i !== indexToDelete);
                setDeck(newDeck);
                showNotification('Erfolg', 'Karte wurde gelöscht.', 'success');
            }
        );
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const name = file.name.replace('.json', '');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                if (Array.isArray(data) && data.every(item => 'front' in item && 'back' in item)) {
                    startDeck(data, name);
                    showNotification('Erfolg', `Deck "${file.name}" wurde erfolgreich importiert.`, 'success');
                } else {
                    throw new Error('Invalid JSON structure');
                }
            } catch (error) {
                showNotification('Importfehler', 'Die Datei ist keine gültige JSON-Datei für Karteikarten.', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    const handleExport = () => {
        if (deck.length === 0) {
            showNotification('Exportfehler', 'Es ist kein Deck zum Exportieren vorhanden.', 'error');
            return;
        }
        const jsonString = JSON.stringify(deck, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${deckName || 'flashcards'}_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleShowHelp = () => {
        const helpMessage = (
            <div className="text-left text-sm space-y-3">
                <p>Willkommen beim Flashcard-Tool! Hier sind die Grundlagen:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Kartenliste:</strong> Sehen Sie alle Karten, fügen Sie neue hinzu, bearbeiten oder löschen Sie sie.</li>
                    <li><strong>Deck importieren:</strong> Klicken Sie auf das Upload-Symbol, um eine JSON-Datei mit Ihren Karteikarten zu laden.</li>
                    <li><strong>Karte umdrehen:</strong> Klicken Sie auf die Karte, um die Rückseite anzuzeigen.</li>
                    <li><strong>Seiten tauschen:</strong> Nutzen Sie den Tausch-Button, um die Rückseiten abzufragen.</li>
                    <li><strong>Zeichnen:</strong> Verwenden Sie den Bereich unter der Karte zum Üben. Er wird bei jeder neuen Karte geleert.</li>
                </ul>
                <p className="font-bold pt-2">JSON-Formatbeispiel:</p>
                <pre className="bg-zinc-900 p-2 rounded-md text-xs text-zinc-300 overflow-x-auto">
                    <code>
{`[
  {
    "front": "Hauptstadt von Deutschland?",
    "back": "Berlin"
  },
  {
    "front": "Was ist 5 x 5?",
    "back": "25"
  }
]`}
                    </code>
                </pre>
            </div>
        );
        showNotification('Anleitung für Flashcards', helpMessage, 'info');
    };

    const currentCard = currentIndex !== null ? deck[currentIndex] : null;
    const cardContent = currentCard ? (isFrontFirst ? { front: currentCard.front, back: currentCard.back } : { front: currentCard.back, back: currentCard.front }) : null;

    const filteredCardList = useMemo(() => {
        return deck
            .map((card, index) => ({ ...card, originalIndex: index }))
            .filter(card => 
                card.front.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                card.back.toLowerCase().includes(listSearchQuery.toLowerCase())
            );
    }, [deck, listSearchQuery]);

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-4">
            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">style</span>
            <h2 className="text-2xl font-bold text-zinc-400">Keine Karten im Deck</h2>
            <p className="mt-1 text-zinc-500 mb-6">Füge eine neue Karte hinzu oder importiere ein Deck, um zu beginnen.</p>
            <div className="flex gap-4">
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white"
                >
                    <span className="material-symbols-outlined mr-2">add_circle</span>
                    <span>Erste Karte erstellen</span>
                </button>
                 <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                    <span className="material-symbols-outlined mr-2">file_upload</span>
                    <span>Importieren</span>
                </button>
            </div>
        </div>
    );

    const renderCardListContent = () => (
        <>
            <header className="flex justify-between items-center p-4 border-b border-zinc-700 flex-shrink-0">
                <h2 className="text-xl font-bold text-zinc-100">Kartenliste ({deck.length})</h2>
                {isMobileView && (
                    <button onClick={() => setIsCardListVisible(false)} className="p-2 -m-2 rounded-full hover:bg-zinc-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </header>
            <div className="p-4 flex-shrink-0 border-b border-zinc-700">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
                    <input
                        type="text"
                        placeholder="Karten durchsuchen..."
                        value={listSearchQuery}
                        onChange={(e) => setListSearchQuery(e.target.value)}
                        className="w-full bg-zinc-700/50 border border-transparent rounded-lg py-2 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                        aria-label="Karten durchsuchen"
                    />
                </div>
            </div>
             <div className="p-4 border-b border-zinc-700">
                <button
                    onClick={handleOpenAddModal}
                    className="w-full flex items-center justify-center font-bold py-2 px-4 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white"
                >
                    <span className="material-symbols-outlined mr-2">add_circle</span>
                    Neue Karte
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {filteredCardList.map((card) => (
                    <div 
                        key={card.originalIndex}
                        className="group w-full text-left p-3 bg-zinc-700/50 rounded-lg flex items-center gap-x-2"
                    >
                        <button onClick={() => handleJumpToCard(card.originalIndex)} className="flex-grow flex justify-between items-center gap-x-4 cursor-pointer overflow-hidden">
                           <p className="text-zinc-200 flex-1 pr-2 truncate" title={card.front}><strong className="text-zinc-400 font-normal">V:</strong> {card.front}</p>
                           <p className="text-violet-300 flex-1 pl-2 border-l border-zinc-600 truncate" title={card.back}><strong className="text-zinc-400 font-normal">A:</strong> {card.back}</p>
                        </button>
                        <div className={`flex-shrink-0 flex items-center transition-opacity ${isMobileView ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                            <button
                                onClick={() => handleOpenEditModal(card, card.originalIndex)}
                                className="p-2 text-zinc-400 rounded-full hover:bg-zinc-600 hover:text-white"
                                aria-label="Karte bearbeiten"
                             >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                                onClick={() => handleDeleteCard(card.originalIndex)}
                                className="p-2 text-zinc-400 rounded-full hover:bg-zinc-600 hover:text-red-400"
                                aria-label="Karte löschen"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
                {filteredCardList.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                        <p>Keine Karten für "{listSearchQuery}" gefunden.</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderMainCardArea = () => (
         <>
            <div className="w-full text-center">
                <p className="font-bold text-zinc-100 truncate">{deckName}</p>
                <p className="text-sm text-zinc-400">{deck.length > 0 ? `Karte ${deck.length - shuffledIndices.length} / ${deck.length}`: 'Keine Karten'}</p>
            </div>

            <div className="w-full max-w-2xl flashcard-container flex-grow min-h-[150px]">
                 {currentCard ? (
                    <div
                        className={`relative w-full h-full flashcard ${isFlipped ? 'is-flipped' : ''}`}
                        onClick={() => setIsFlipped(f => !f)}
                        role="button"
                        tabIndex={0}
                        aria-label="Karte umdrehen"
                    >
                        <div className="absolute w-full h-full flashcard-face bg-zinc-800 rounded-xl flex items-center justify-center p-6 text-center shadow-lg">
                            <p className="text-2xl md:text-3xl font-semibold text-zinc-100">{cardContent?.front}</p>
                        </div>
                        <div className="absolute w-full h-full flashcard-face flashcard-back bg-zinc-700 rounded-xl flex items-center justify-center p-6 text-center shadow-lg">
                            <p className="text-2xl md:text-3xl font-semibold text-violet-300">{cardContent?.back}</p>
                        </div>
                    </div>
                 ) : (
                    <div className="w-full h-full bg-zinc-800 rounded-xl flex items-center justify-center p-6 text-center shadow-lg text-zinc-500">
                        <p>Das Deck ist leer.</p>
                    </div>
                 )}
            </div>

            <div className="w-full max-w-2xl flex flex-col items-center">
                <DrawingCanvas ref={drawingCanvasRef} />
            </div>

            <button
                onClick={handleNextCard}
                disabled={deck.length === 0}
                className="w-full max-w-2xl flex items-center justify-center font-bold py-3 px-6 rounded-lg transition-colors bg-zinc-700 hover:bg-zinc-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined mr-2">skip_next</span>
                <span>Nächste Karte</span>
            </button>
        </>
    );
    
    return (
        <div className={`animate-fadeIn h-full flex flex-col`}>
            <style>{`
                .flashcard-container { perspective: 1000px; }
                .flashcard {
                    transform-style: preserve-3d;
                    transition: transform 0.6s;
                }
                .flashcard.is-flipped { transform: rotateY(180deg); }
                .flashcard-face {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                .flashcard-back { transform: rotateY(180deg); }
            `}</style>

            <header className="flex items-center justify-between text-zinc-300 p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0 flex-nowrap gap-x-2">
                {isMobileView && onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 flex-shrink-0" aria-label="Zurück">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                    <span className="material-symbols-outlined text-3xl">style</span>
                    <h1 className="text-2xl font-bold tracking-tight truncate">Flashcards</h1>
                </div>
                 <div className="flex items-center space-x-2 flex-shrink-0">
                    <button 
                        onClick={handleShowHelp} 
                        className={`flex items-center justify-center bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors ${isMobileView ? 'w-9 h-9' : 'py-2 px-3'}`} 
                        aria-label="Anleitung anzeigen"
                    >
                        <span className={`material-symbols-outlined ${!isMobileView ? 'mr-1.5 text-lg' : ''}`}>help_outline</span>
                        {!isMobileView && <span className="font-medium text-sm whitespace-nowrap">Anleitung</span>}
                    </button>
                    
                    {isMobileView && (
                        <button onClick={() => setIsCardListVisible(true)} className="w-9 h-9 flex items-center justify-center bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg" aria-label="Kartenliste anzeigen">
                            <span className="material-symbols-outlined">list</span>
                        </button>
                    )}
                    
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className={`flex items-center justify-center bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors ${isMobileView ? 'w-9 h-9' : 'py-2 px-3'}`} 
                        aria-label="Importieren"
                    >
                        <span className={`material-symbols-outlined ${!isMobileView ? 'mr-1.5 text-lg' : ''}`}>file_upload</span>
                        {!isMobileView && <span className="font-medium text-sm whitespace-nowrap">Import</span>}
                    </button>

                    <button 
                        onClick={handleExport} 
                        className={`flex items-center justify-center bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-colors ${isMobileView ? 'w-9 h-9' : 'py-2 px-3'}`} 
                        aria-label="Exportieren"
                    >
                        <span className={`material-symbols-outlined ${!isMobileView ? 'mr-1.5 text-lg' : ''}`}>file_download</span>
                        {!isMobileView && <span className="font-medium text-sm whitespace-nowrap">Export</span>}
                    </button>

                    <button 
                        onClick={() => setIsFrontFirst(prev => !prev)} 
                        className={`flex items-center justify-center rounded-lg transition-colors ${isFrontFirst ? 'bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300' : 'bg-violet-600 text-white'} ${isMobileView ? 'w-9 h-9' : 'py-2 px-3'}`} 
                        aria-label="Vorder- und Rückseite tauschen"
                    >
                        <span className={`material-symbols-outlined ${!isMobileView ? 'mr-1.5 text-lg' : ''}`}>swap_horiz</span>
                        {!isMobileView && <span className="font-medium text-sm whitespace-nowrap">Tauschen</span>}
                    </button>
                </div>
            </header>

            {deck.length === 0 ? (
                <div className="flex-grow">{renderEmptyState()}</div>
            ) : isMobileView ? (
                <div className="flex-grow flex flex-col items-center justify-between p-4 pt-0 gap-4">
                    {renderMainCardArea()}
                </div>
            ) : (
                <div className="flex-grow flex gap-6 p-4 pt-2 overflow-hidden">
                    <main className="flex-1 flex flex-col items-center justify-between gap-4">
                        {renderMainCardArea()}
                    </main>
                    <aside className="w-96 flex-shrink-0 h-full">
                        <div className="bg-zinc-800/50 rounded-lg flex flex-col h-full">
                           {renderCardListContent()}
                        </div>
                    </aside>
                </div>
            )}

            {isMobileView && isCardListVisible && (
                <div className="fixed inset-0 z-40 bg-zinc-900/80 backdrop-blur-sm flex flex-col p-4 animate-fadeIn" onClick={() => setIsCardListVisible(false)}>
                    <div className="bg-zinc-800 rounded-xl flex flex-col h-full max-h-[80vh] m-auto w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        {renderCardListContent()}
                    </div>
                </div>
            )}
            <CardFormModal
                isOpen={isCardFormModalOpen}
                onClose={() => setIsCardFormModalOpen(false)}
                onSave={handleSaveCard}
                cardToEdit={editingCard?.card || null}
            />
        </div>
    );
};

export default FlashcardsView;