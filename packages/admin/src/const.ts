const rawNewApiUrl = import.meta.env.VITE_NEW_API_URL_ENV || '';

/**
 * На деплоях часто встречается некорректная строка base URL вида:
 * `http://host:8000/feedapi/v1` (в то время как API доступно как `https://host/feedapi/v1`).
 * Нормализуем только для внешних доменов `*.insomniafest.ru`, чтобы не ломать локальную разработку.
 */
const normalizeNewApiUrl = (value: string): string => {
    if (!value) return value;

    try {
        const url = new URL(value);

        const isInsomniafestDomain = url.hostname.endsWith('insomniafest.ru');
        const isPort8000 = url.port === '8000';

        if (isInsomniafestDomain && isPort8000) {
            url.port = '';
            if (url.protocol === 'http:') {
                url.protocol = 'https:';
            }
        }

        // Убираем лишние завершающие слэши, чтобы сборка url в коде была предсказуемой
        return url.toString().replace(/\/+$/u, '');
    } catch {
        return value;
    }
};

export const NEW_API_URL = normalizeNewApiUrl(rawNewApiUrl);

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
