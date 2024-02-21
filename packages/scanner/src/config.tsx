const DEV = process.env.NODE_ENV !== 'production';
const REACT_APP_NEW_API_URL_ENV = process.env.REACT_APP_NEW_API_URL_ENV;

export const API_DOMAIN =
    REACT_APP_NEW_API_URL_ENV ||
    (DEV ? 'http://localhost:8000/feedapi/v1' : `https://feed.cherepusick.keenetic.name/api/v1`);
// export const API_DOMAIN = `https://yclins.cherepusick.keenetic.name`;
