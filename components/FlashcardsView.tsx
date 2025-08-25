import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flashcard, FlashcardDeck } from '../types';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';

interface FlashcardsViewProps {
    isMobileView?: boolean;
    onBack?: () => void;
    showNotification: (title: string, message: string | React.ReactNode, type?: 'info' | 'success' | 'error') => void;
}

const HIRAGANA_DECK: FlashcardDeck = [
    { front: 'あ', back: 'a' }, { front: 'い', back: 'i' }, { front: 'う', back: 'u' }, { front: 'え', back: 'e' }, { front: 'お', back: 'o' },
    { front: 'か', back: 'ka' }, { front: 'き', back: 'ki' }, { front: 'く', back: 'ku' }, { front: 'け', back: 'ke' }, { front: 'こ', back: 'ko' },
    { front: 'さ', back: 'sa' }, { front: 'し', back: 'shi' }, { front: 'す', back: 'su' }, { front: 'せ', back: 'se' }, { front: 'そ', back: 'so' },
    { front: 'た', back: 'ta' }, { front: 'ち', back: 'chi' }, { front: 'つ', back: 'tsu' }, { front: 'て', back: 'te' }, { front: 'と', back: 'to' },
    { front: 'な', back: 'na' }, { front: 'に', back: 'ni' }, { front: 'ぬ', back: 'nu' }, { front: 'ね', back: 'ne' }, { front: 'の', back: 'no' },
    { front: 'は', back: 'ha' }, { front: 'ひ', back: 'hi' }, { front: 'ふ', back: 'fu' }, { front: 'へ', back: 'he' }, { front: 'ほ', back: 'ho' },
    { front: 'ま', back: 'ma' }, { front: 'み', back: 'mi' }, { front: 'む', back: 'mu' }, { front: 'め', back: 'me' }, { front: 'も', back: 'mo' },
    { front: 'や', back: 'ya' }, { front: 'ゆ', back: 'yu' }, { front: 'よ', back: 'yo' },
    { front: 'ら', back: 'ra' }, { front: 'り', back: 'ri' }, { front: 'る', back: 'ru' }, { front: 'れ', back: 're' }, { front: 'ろ', back: 'ro' },
    { front: 'わ', back: 'wa' }, { front: 'を', back: 'wo' },
    { front: 'ん', back: 'n' },
];

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ isMobileView = false, onBack, showNotification }) => {
    const [deck, setDeck] = useState<FlashcardDeck>([]);
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFrontFirst, setIsFrontFirst] = useState(true);
    const [deckName, setDeckName] = useState<string>('');
    const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const indices = newDeck.map((_, i) => i);
        const newShuffledIndices = shuffleArray(indices);
        const firstIndex = newShuffledIndices.pop() ?? null;
        setShuffledIndices(newShuffledIndices);
        setCurrentIndex(firstIndex);
        setIsFlipped(false);
        drawingCanvasRef.current?.clearCanvas();
    }, []);
    
    useEffect(() => {
        // Load the default Hiragana deck on initial mount
        startDeck(HIRAGANA_DECK, 'Hiragana');
    }, [startDeck]);


    const handleNextCard = () => {
        if (shuffledIndices.length === 0) {
            // Reshuffle and start over if deck is finished
            showNotification('Deck beendet', 'Alle Karten wurden angezeigt. Das Deck wird neu gemischt.', 'info');
            const indices = deck.map((_, i) => i);
            const newShuffledIndices = shuffleArray(indices);
            const nextIndex = newShuffledIndices.pop() ?? null;
            setShuffledIndices(newShuffledIndices);
            setCurrentIndex(nextIndex);
        } else {
            const newShuffled = [...shuffledIndices];
            const nextIndex = newShuffled.pop() ?? null;
            setShuffledIndices(newShuffled);
            setCurrentIndex(nextIndex);
        }
        setIsFlipped(false);
        drawingCanvasRef.current?.clearCanvas();
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

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
            <span className="material-symbols-outlined text-6xl mb-4 text-zinc-600">style</span>
            <h2 className="text-2xl font-bold text-zinc-400">Kein Deck geladen</h2>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 flex items-center font-bold py-2.5 px-5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
            >
                <span className="material-symbols-outlined mr-2">file_upload</span>
                <span>Deck importieren</span>
            </button>
        </div>
    );
    
    return (
        <div className={`animate-fadeIn h-full flex flex-col ${isMobileView ? '' : 'p-4 sm:p-0'}`}>
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

            <header className="flex items-center justify-between text-zinc-300 p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
                {isMobileView && onBack && (
                    <button onClick={onBack} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Zurück">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="flex items-center space-x-2 flex-grow">
                    <span className="material-symbols-outlined text-3xl">style</span>
                    <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
                </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={handleShowHelp} className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg" aria-label="Anleitung anzeigen"><span className="material-symbols-outlined">help_outline</span></button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg" aria-label="Importieren"><span className="material-symbols-outlined">file_upload</span></button>
                    <button onClick={handleExport} className="p-2 bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300 rounded-lg" aria-label="Exportieren"><span className="material-symbols-outlined">file_download</span></button>
                    <button onClick={() => setIsFrontFirst(prev => !prev)} className={`p-2 rounded-lg transition-colors ${isFrontFirst ? 'bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300' : 'bg-violet-600 text-white'}`} aria-label="Vorder- und Rückseite tauschen"><span className="material-symbols-outlined">swap_horiz</span></button>
                </div>
            </header>

            {deck.length === 0 ? renderEmptyState() : (
                <div className="flex-grow flex flex-col items-center justify-between p-4 sm:p-6 pt-0 sm:pt-2 gap-4">
                    <div className="w-full text-center">
                        <p className="font-bold text-zinc-100 truncate">{deckName}</p>
                        <p className="text-sm text-zinc-400">Karte {deck.length - shuffledIndices.length} / {deck.length}</p>
                    </div>

                    <div className="w-full max-w-2xl flashcard-container flex-grow min-h-[150px]">
                        <div
                            className={`relative w-full h-full flashcard ${isFlipped ? 'is-flipped' : ''}`}
                            onClick={() => setIsFlipped(f => !f)}
                            role="button"
                            tabIndex={0}
                            aria-label="Karte umdrehen"
                        >
                            {/* Front */}
                            <div className="absolute w-full h-full flashcard-face bg-zinc-800 rounded-xl flex items-center justify-center p-6 text-center shadow-lg">
                                <p className="text-2xl md:text-3xl font-semibold text-zinc-100">{cardContent?.front}</p>
                            </div>
                            {/* Back */}
                            <div className="absolute w-full h-full flashcard-face flashcard-back bg-zinc-700 rounded-xl flex items-center justify-center p-6 text-center shadow-lg">
                                <p className="text-2xl md:text-3xl font-semibold text-violet-300">{cardContent?.back}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl flex flex-col items-center">
                        <DrawingCanvas ref={drawingCanvasRef} />
                    </div>

                    <button
                        onClick={handleNextCard}
                        className="w-full max-w-2xl flex items-center justify-center font-bold py-3 px-6 rounded-lg transition-colors bg-zinc-700 hover:bg-zinc-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-violet-500"
                    >
                        <span className="material-symbols-outlined mr-2">skip_next</span>
                        <span>Nächste Karte</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default FlashcardsView;