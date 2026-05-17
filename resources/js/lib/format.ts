import i18n from 'i18next';

export const formatDate = (date: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(date).toLocaleDateString(i18n.language, opts);

export const formatDateTime = (
    date: string,
    opts?: Intl.DateTimeFormatOptions,
) => new Date(date).toLocaleString(i18n.language, opts);

export const formatTime = (date: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(date).toLocaleTimeString(i18n.language, opts);

export const formatCurrency = (amount: number, currency = 'EUR') =>
    new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency,
    }).format(amount);

export const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
        return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const timeAgo = (dateStr: string): string => {
    const seconds = Math.floor(
        (Date.now() - new Date(dateStr).getTime()) / 1000,
    );

    if (seconds < 60) {
        return i18n.t('format.just_now');
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return i18n.t('format.minutes_ago', { count: minutes });
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return i18n.t('format.hours_ago', { count: hours });
    }

    const days = Math.floor(hours / 24);

    return i18n.t('format.days_ago', { count: days });
};

export const getInitials = (name: string): string =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
