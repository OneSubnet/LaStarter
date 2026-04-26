import i18n from 'i18next';

export const formatDate = (date: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(date).toLocaleDateString(i18n.language, opts);

export const formatDateTime = (date: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(date).toLocaleString(i18n.language, opts);

export const formatTime = (date: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(date).toLocaleTimeString(i18n.language, opts);

export const formatCurrency = (amount: number, currency = 'EUR') =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(amount);
