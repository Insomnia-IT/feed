export const NEW_API_URL = import.meta.env.VITE_NEW_API_URL_ENV || '';

const getScannerUrl = () => {
    const envUrl = import.meta.env.VITE_SCANNER_URL_ENV;
    if (envUrl) {
        return envUrl;
    }

    if (typeof window === 'undefined') {
        return '';
    }

    if (import.meta.env.DEV) {
        return 'http://localhost:3001/scanner/';
    }

    return `${window.location.origin}/scanner/`;
};

export const SCANNER_URL = getScannerUrl();

// Имя кастомного поля "выдан бейдж"
export const HAS_BADGE_FIELD_NAME = 'Бейдж у руководителя';

export const MEAL_MAP: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const DATETIME_SHORT = 'DD.MM HH:mm';
export const DATETIME_LONG = 'DD MMMM HH:mm:ss';
