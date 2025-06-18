export const NEW_API_URL = import.meta.env.VITE_NEW_API_URL_ENV || '';

// Имя кастомного поля "выдан бейдж"
export const HAS_BADGE_FIELD_NAME = 'Выдан бейдж';

export const MEAL_MAP: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const DATETIME_SHORT = 'DD.MM HH:mm';
export const DATETIME_LONG = 'DD MMMM HH:mm:ss';
