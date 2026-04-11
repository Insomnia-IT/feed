/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_NEW_API_URL_ENV?: string;
    readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
