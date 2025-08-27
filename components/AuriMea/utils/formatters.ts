export const formatCurrency = (value: number, locale = 'de-DE', currency = 'EUR') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(value);
};