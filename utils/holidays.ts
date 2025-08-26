export interface Holiday {
    date: Date;
    name: string;
    description: string;
}

const holidayDetails: Record<string, string> = {
    'Neujahrstag': 'Gesetzlicher Feiertag am 1. Januar zur Begrüßung des neuen Jahres.',
    'Heilige Drei Könige': 'Christlicher Feiertag am 6. Januar, an dem der Besuch der Weisen aus dem Morgenland bei Jesus gefeiert wird.',
    'Ostermontag': 'Der Montag nach dem Ostersonntag, ein gesetzlicher Feiertag in Österreich zur Feier der Auferstehung.',
    'Staatsfeiertag': 'Der österreichische Staatsfeiertag am 1. Mai, auch als Tag der Arbeit bekannt.',
    'Christi Himmelfahrt': 'Ein christlicher Feiertag, der 39 Tage nach dem Ostersonntag gefeiert wird und die Aufnahme Jesu in den Himmel markiert.',
    'Pfingstmontag': 'Der Montag nach dem Pfingstsonntag, ein gesetzlicher Feiertag in Österreich, an dem die Entsendung des Heiligen Geistes gefeiert wird.',
    'Fronleichnam': 'Ein katholischer Feiertag, der 60 Tage nach Ostersonntag stattfindet und die leibliche Gegenwart Jesu Christi im Sakrament der Eucharistie feiert.',
    'Mariä Himmelfahrt': 'Ein katholischer Feiertag am 15. August, der die Aufnahme Marias in den Himmel feiert.',
    'Nationalfeiertag': 'Der Nationalfeiertag Österreichs am 26. Oktober, der an die Verabschiedung des Neutralitätsgesetzes im Jahr 1955 erinnert.',
    'Allerheiligen': 'Ein katholischer Feiertag am 1. November zum Gedenken an alle Heiligen.',
    'Mariä Empfängnis': 'Ein katholischer Feiertag am 8. Dezember, der die unbefleckte Empfängnis Marias feiert.',
    'Christtag': 'Der erste Weihnachtsfeiertag am 25. Dezember zur Feier der Geburt Jesu Christi.',
    'Stefanitag': 'Der zweite Weihnachtsfeiertag am 26. Dezember, in Österreich als Stefanitag bekannt.',
};

// Calculates Easter Sunday for a given year using the Gregorian algorithm (Meeus/Jones/Butcher)
const getEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
};

export const getHolidaysForMonth = (year: number, month: number): Holiday[] => {
    const holidays: Omit<Holiday, 'description'>[] = [];
    const easter = getEaster(year);

    // Fixed holidays
    holidays.push({ name: 'Neujahrstag', date: new Date(Date.UTC(year, 0, 1)) });
    holidays.push({ name: 'Heilige Drei Könige', date: new Date(Date.UTC(year, 0, 6)) });
    holidays.push({ name: 'Staatsfeiertag', date: new Date(Date.UTC(year, 4, 1)) });
    holidays.push({ name: 'Mariä Himmelfahrt', date: new Date(Date.UTC(year, 7, 15)) });
    holidays.push({ name: 'Nationalfeiertag', date: new Date(Date.UTC(year, 9, 26)) });
    holidays.push({ name: 'Allerheiligen', date: new Date(Date.UTC(year, 10, 1)) });
    holidays.push({ name: 'Mariä Empfängnis', date: new Date(Date.UTC(year, 11, 8)) });
    holidays.push({ name: 'Christtag', date: new Date(Date.UTC(year, 11, 25)) });
    holidays.push({ name: 'Stefanitag', date: new Date(Date.UTC(year, 11, 26)) });

    // Holidays dependent on Easter
    const addDays = (date: Date, days: number): Date => {
        const result = new Date(date);
        result.setUTCDate(result.getUTCDate() + days);
        return result;
    };

    holidays.push({ name: 'Ostermontag', date: addDays(easter, 1) });
    holidays.push({ name: 'Christi Himmelfahrt', date: addDays(easter, 39) });
    holidays.push({ name: 'Pfingstmontag', date: addDays(easter, 50) });
    holidays.push({ name: 'Fronleichnam', date: addDays(easter, 60) });
    
    return holidays
        .filter(h => h.date.getUTCMonth() === month)
        .map(h => ({ ...h, description: holidayDetails[h.name] || '' }));
};