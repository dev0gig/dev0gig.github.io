import { useState, useEffect, useCallback } from 'react';
import { Flashcard, FlashcardDeck } from '../types';

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

export const useFlashcardsData = () => {
    const [deck, setDeck] = useState<FlashcardDeck>([]);
    const [deckName, setDeckName] = useState<string>('');
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedDeck = localStorage.getItem('axismea-flashcards-deck');
            const storedDeckName = localStorage.getItem('axismea-flashcards-deckName');

            if (storedDeck && storedDeckName) {
                setDeck(JSON.parse(storedDeck));
                setDeckName(JSON.parse(storedDeckName));
            } else {
                setDeck(HIRAGANA_DECK);
                setDeckName('Hiragana');
            }
        } catch (error) {
            console.error("Failed to load flashcards data from localStorage", error);
            setDeck(HIRAGANA_DECK);
            setDeckName('Hiragana');
        } finally {
            setIsDataLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isDataLoaded) {
            localStorage.setItem('axismea-flashcards-deck', JSON.stringify(deck));
            localStorage.setItem('axismea-flashcards-deckName', JSON.stringify(deckName));
        }
    }, [deck, deckName, isDataLoaded]);

    const importFlashcardsData = useCallback((data: { deck: FlashcardDeck; deckName: string }) => {
        setDeck(data.deck);
        setDeckName(data.deckName);
    }, []);

    const resetFlashcardsData = useCallback(() => {
        setDeck([]);
        setDeckName('');
        localStorage.removeItem('axismea-flashcards-deck');
        localStorage.removeItem('axismea-flashcards-deckName');
    }, []);

    return {
        deck,
        setDeck,
        deckName,
        setDeckName,
        importFlashcardsData,
        resetFlashcardsData,
    };
};
