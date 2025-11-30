import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [
        react(),

        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
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
                        src: '/android-chrome-96x96.png',
                        sizes: '96x96',
                        type: 'image/png'
                    },
                    {
                        src: '/mstile-150x150.png',
                        sizes: '150x150',
                        type: 'image/png'
                    },
                    {
                        src: '/apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png'
                    },
                    {
                        src: '/favicon-32x32.png',
                        sizes: '32x32',
                        type: 'image/png'
                    },
                    {
                        src: '/favicon-16x16.png',
                        sizes: '16x16',
                        type: 'image/png'
                    },
                    {
                        src: '/safari-pinned-tab.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /\/feedapi\/v1\//,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'feed-data',
                            backgroundSync: {
                                name: 'feed-queue',
                                options: { maxRetentionTime: 24 * 60 }
                            },
                            expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }
                        }
                    }
                ]
            }
        }),

        viteStaticCopy({
            targets: [{ src: 'src/pwa-ver.txt', dest: '' }]
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

    assetsInclude: ['**/*.txt'],

    server: {
        port: 3001
    }
});
