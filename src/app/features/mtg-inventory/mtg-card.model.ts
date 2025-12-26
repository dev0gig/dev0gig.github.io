/**
 * MTG Card Models
 * Split into basic (import) and details (lazy-loaded from API)
 */

/**
 * Basic card data from Arena format import
 * No API call needed - parsed directly from import text
 */
export interface MtgCardBasic {
    /** 3-letter set code (e.g., "MH2", "2X2") */
    set: string;
    /** Collector number within the set */
    collectorNumber: string;
    /** English name from import */
    nameEN: string;
}

/**
 * Additional details fetched lazily from Scryfall API
 * Cached separately in localStorage
 */
export interface MtgCardDetails {
    /** German name (fallback to English if not available) */
    nameDE: string;
    /** Full set name (e.g., "Modern Horizons 2") */
    setName: string;
    /** URL to card image from Scryfall */
    imageUrl: string;
    /** Timestamp when fetched (for cache validation) */
    fetchedAt: number;
    /** Price in EUR (from Cardmarket via Scryfall) */
    priceEur?: string | null;
    /** Foil price in EUR */
    priceEurFoil?: string | null;
    /** Price in USD */
    priceUsd?: string | null;
    /** Foil price in USD */
    priceUsdFoil?: string | null;
    /** Card rarity (common, uncommon, rare, mythic) */
    rarity?: string;
    /** Mana cost string (e.g., "{2}{U}{U}") */
    manaCost?: string | null;
    /** Legalities in different formats */
    legalities?: {
        standard?: string;
        modern?: string;
        commander?: string;
        legacy?: string;
        pioneer?: string;
        pauper?: string;
    };
    /** Direct link to Cardmarket */
    cardmarketUrl?: string;
}

/**
 * Combined card for display (basic + optional details)
 */
export interface MtgCardDisplay extends MtgCardBasic {
    details?: MtgCardDetails;
    isLoading?: boolean;
}

/**
 * Cache key generator for consistent lookup
 */
export function getCardKey(set: string, collectorNumber: string): string {
    return `${set.toUpperCase()}-${collectorNumber}`;
}

/**
 * Scryfall API response structure (simplified)
 */
export interface ScryfallCard {
    id: string;
    name: string;
    printed_name?: string;
    set: string;
    set_name: string;
    collector_number: string;
    image_uris?: {
        normal: string;
        small: string;
        large: string;
    };
    card_faces?: Array<{
        image_uris?: {
            normal: string;
            small: string;
        };
        mana_cost?: string;
    }>;
    lang: string;
    /** Price data from Scryfall */
    prices?: {
        eur?: string | null;
        eur_foil?: string | null;
        usd?: string | null;
        usd_foil?: string | null;
    };
    /** Card rarity */
    rarity?: string;
    /** Mana cost */
    mana_cost?: string;
    /** Format legalities */
    legalities?: {
        standard?: string;
        modern?: string;
        commander?: string;
        legacy?: string;
        pioneer?: string;
        pauper?: string;
    };
    /** Purchase URIs */
    purchase_uris?: {
        cardmarket?: string;
    };
}
