import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class JournalOcrUtilityService {

    /**
     * Clean OCR text by removing excessive whitespace and formatting paragraphs
     * OCR often produces text with multiple spaces between words
     *
     * Rules:
     * - First line is the date (handled separately)
     * - Lines starting with "-" create new paragraphs
     * - Lines without "-" are joined to the previous line as flowing text
     */
    cleanOcrText(text: string): string {
        // First, clean up excessive whitespace in each line
        const lines = text.split('\n').map(line => {
            return line
                // Replace multiple spaces with single space
                .replace(/  +/g, ' ')
                // Fix spaces before punctuation
                .replace(/ ([.,!?;:])/g, '$1')
                // Fix spaces after opening brackets/quotes
                .replace(/([(\[„"']) /g, '$1')
                // Fix spaces before closing brackets/quotes
                .replace(/ ([)\]"'"])/g, '$1')
                // Trim the line
                .trim();
        }).filter(line => line.length > 0); // Remove empty lines

        if (lines.length === 0) return '';

        // First line is the date, keep it separate
        const result: string[] = [lines[0]];
        let currentParagraph = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            // Check if line starts with "-" (new paragraph/bullet point marker)
            if (line.startsWith('-')) {
                // Save current paragraph if exists
                if (currentParagraph) {
                    result.push(currentParagraph);
                    currentParagraph = '';
                }
                // Start new paragraph, keep the "-" as bullet point
                currentParagraph = '- ' + line.substring(1).trim();
            } else {
                // Join to current paragraph with space
                if (currentParagraph) {
                    // Handle hyphenated words at end of line (word- next -> wordnext)
                    if (currentParagraph.endsWith('-')) {
                        currentParagraph = currentParagraph.slice(0, -1) + line;
                    } else {
                        currentParagraph += ' ' + line;
                    }
                } else {
                    currentParagraph = line;
                }
            }
        }

        // Don't forget the last paragraph
        if (currentParagraph) {
            result.push(currentParagraph);
        }

        return result.join('\n');
    }

    /**
     * Parse date from first line of OCR text
     * Supports formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
     */
    parseDateFromText(text: string): { date: Date | null; remainingText: string } {
        const lines = text.split('\n');
        if (lines.length === 0) {
            return { date: null, remainingText: text };
        }

        const firstLine = lines[0].trim();

        // Try to parse date in format DD.MM.YYYY, DD/MM/YYYY, or DD-MM-YYYY
        const dateMatch = firstLine.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

        if (dateMatch) {
            const day = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
            const year = parseInt(dateMatch[3], 10);

            const date = new Date(year, month, day);

            // Validate the date is valid
            if (!isNaN(date.getTime()) && date.getDate() === day) {
                // Remove the date line from the text
                const remainingText = lines.slice(1).join('\n').trim();
                return { date, remainingText };
            }
        }

        return { date: null, remainingText: text };
    }

    /**
     * Parse OCR text and return structured data or error
     */
    processOcrRequest(rawText: string): { success: boolean; date: Date | null; text?: string; error?: string } {
        // First clean the OCR text
        const cleanedText = this.cleanOcrText(rawText);

        // Parse date from first line
        const { date, remainingText } = this.parseDateFromText(cleanedText);

        if (!date) {
            return {
                success: false,
                date: null,
                error: 'Could not parse date from first line. Expected format: DD.MM.YYYY'
            };
        }

        if (!remainingText.trim()) {
            return {
                success: false,
                date: null,
                error: 'No text content found after date line'
            };
        }

        return { success: true, date, text: remainingText };
    }
}
