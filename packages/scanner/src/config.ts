const DEV = import.meta.env.DEV;
const NEW_API_URL = import.meta.env.VITE_NEW_API_URL_ENV;

export const API_DOMAIN =
    NEW_API_URL || (DEV ? 'http://localhost:8000/feedapi/v1' : 'https://feed.cherepusick.keenetic.name/api/v1');
