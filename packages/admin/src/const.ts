/** В dev по умолчанию `/feedapi/v1` — запросы идут через proxy Vite (vite.config.ts). */
export const NEW_API_URL = import.meta.env.VITE_NEW_API_URL_ENV || (import.meta.env.DEV ? '/feedapi/v1' : '');

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

/** localStorage: `'true'` — карточка волонтёра в интерфейсе с main до редизайна. */
export const VOLUNTEER_CARD_LEGACY_UI_STORAGE_KEY = 'volunteerCardLegacyUi';

/** sessionStorage: баннер переключения интерфейса скрыт до конца сессии вкладки. */
export const VOLUNTEER_CARD_NEW_UI_BANNER_DISMISSED_KEY = 'volunteerCardNewUiBannerDismissed';
export const VOLUNTEER_CARD_LEGACY_UI_BANNER_DISMISSED_KEY = 'volunteerCardLegacyUiBannerDismissed';

export const MEAL_MAP: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const MEAL_TIME_OPTIONS = [
    { value: 'breakfast', label: 'Завтрак' },
    { value: 'lunch', label: 'Обед' },
    { value: 'dinner', label: 'Ужин' },
    { value: 'night', label: 'Дожор' }
];

export const DATETIME_SHORT = 'DD.MM HH:mm';
export const DATETIME_LONG = 'DD MMMM HH:mm:ss';
