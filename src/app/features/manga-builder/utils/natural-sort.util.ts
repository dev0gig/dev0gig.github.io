/**
 * Natural sort comparison function
 * Correctly sorts strings with numbers: ['2', '10', '1', '2.5'] -> ['1', '2', '2.5', '10']
 */
export function naturalSort(a: string, b: string): number {
    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base'
    });
    return collator.compare(a, b);
}

/**
 * Natural sort for an array of strings
 */
export function naturalSortArray(arr: string[]): string[] {
    return [...arr].sort(naturalSort);
}

/**
 * Natural sort for objects by a specific key
 */
export function naturalSortBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
    return [...arr].sort((a, b) => naturalSort(keyFn(a), keyFn(b)));
}

/**
 * Extract chapter number from filename for sorting
 * Examples:
 *   "Chapter 2.5.cbz" -> "2.5"
 *   "Vol.01 Ch.003" -> "003"
 *   "manga_c012_v02" -> "012"
 */
export function extractChapterNumber(filename: string): string {
    // Remove extension
    const name = filename.replace(/\.(cbz|zip)$/i, '');

    // Common chapter patterns
    const patterns = [
        /ch(?:apter)?[\s._-]*(\d+(?:\.\d+)?)/i,
        /c(\d+(?:\.\d+)?)/i,
        /[\s._-](\d+(?:\.\d+)?)[\s._-]?$/,
        /^(\d+(?:\.\d+)?)/
    ];

    for (const pattern of patterns) {
        const match = name.match(pattern);
        if (match) {
            return match[1];
        }
    }

    // Fallback to full name for sorting
    return name;
}

/**
 * Sort chapter files by extracted chapter number
 */
export function sortChapterFiles<T extends { name: string }>(files: T[]): T[] {
    return naturalSortBy(files, f => extractChapterNumber(f.name));
}
