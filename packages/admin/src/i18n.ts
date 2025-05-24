import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n.use(Backend)
    .use(initReactI18next)
    .init({
        debug: true,
        lng: 'ru',
        fallbackLng: ['ru'],
        ns: ['common'],
        defaultNS: 'common',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json'
        },
        interpolation: {
            escapeValue: false
        }
    })
    .catch((err) => console.error('Ошибка инициализации i18n:', err));

export default i18n;
