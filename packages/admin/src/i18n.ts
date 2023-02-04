import Backend from 'i18next-http-backend';
// import detector from 'i18next-browser-languagedetector';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isBrowser } from 'nookies/dist/utils';

void i18n
    .use(Backend)
    // .use(detector)
    .use(initReactI18next)
    .init({
        lng: 'ru',
        load: 'languageOnly',
        supportedLngs: ['ru', 'en'],
        backend: {
            loadPath: isBrowser() ? '/locales/{{lng}}/{{ns}}.json' : '../public/locales/{{lng}}/{{ns}}.json'
        },
        defaultNS: 'common',
        fallbackLng: ['en', 'de']
    });

// eslint-disable-next-line import/no-default-export
export default i18n;
