export const isServer = typeof window === 'undefined';
export const isBrowser = !isServer;
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = !isProd;
