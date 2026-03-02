import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: '/scanner/',
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']]
            }
        }),

        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'Feed Scanner',
                short_name: 'Scanner',
                start_url: '/scanner/',
                display: 'standalone',
                theme_color: '#1976d2',
                background_color: '#ffffff',
                icons: [
                    {
                        src: 'android-chrome-96x96.png',
                        sizes: '96x96',
                        type: 'image/png'
                    },
                    {
                        src: 'mstile-150x150.png',
                        sizes: '150x150',
                        type: 'image/png'
                    },
                    {
                        src: 'apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png'
                    },
                    {
                        src: 'favicon-32x32.png',
                        sizes: '32x32',
                        type: 'image/png'
                    },
                    {
                        src: 'favicon-16x16.png',
                        sizes: '16x16',
                        type: 'image/png'
                    },
                    {
                        src: 'safari-pinned-tab.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],

    resolve: {
        alias: {
            components: path.resolve(__dirname, './src/components'),
            shared: path.resolve(__dirname, './src/shared'),
            model: path.resolve(__dirname, './src/model'),
            screens: path.resolve(__dirname, './src/screens'),
            request: path.resolve(__dirname, './src/request'),
            db: path.resolve(__dirname, './src/db.ts'),
            config: path.resolve(__dirname, './src/config.ts'),
            'request-local-db': path.resolve(__dirname, './src/request-local-db')
        }
    },

    server: {
        port: 3001
    }
});
