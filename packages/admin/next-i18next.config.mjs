import path from 'path';
import Backend from 'i18next-http-backend';

const localePath = path.resolve('./public/locales')

export const i18n = {
    debug: process.env.NODE_ENV === 'development',
    use: [Backend],
    i18n: {
        defaultLocale: 'ru',
        locales: ['en', 'ru'],
    },
    localePath,
    reloadOnPrerender: process.env.NODE_ENV === 'development',
    lng: 'ru',
    // load: 'languageOnly',
    supportedLngs: ['ru', 'en'],
    defaultNS: 'common',
    fallbackLng: ['en']
};
