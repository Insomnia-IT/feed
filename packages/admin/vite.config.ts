import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        babel({
            presets: [reactCompilerPreset()]
        }),
        VitePWA({
            disable: true,
            registerType: 'autoUpdate',
            injectRegister: 'inline',
            includeAssets: ['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Admin Front',
                short_name: 'Admin',
                description: 'Панель администратора',
                id: '/volunteers',
                start_url: '/volunteers',
                scope: '/',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                icons: [
                    {
                        src: 'favicon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png'
                    },
                    {
                        src: 'apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png'
                    },
                    {
                        src: 'web-app-manifest-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'web-app-manifest-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                navigateFallbackDenylist: [/^\/scanner(?:\/|$)/, /^\/feedapi(?:\/|$)/, /^\/admin(?:\/|$)/]
            }
        })
    ],
    resolve: {
        dedupe: ['react', 'react-dom', 'react-router'],
        alias: {
            utils: path.resolve(import.meta.dirname, './src/utils.ts'),
            auth: path.resolve(import.meta.dirname, './src/auth.ts'),
            authProvider: path.resolve(import.meta.dirname, './src/authProvider.ts'),
            const: path.resolve(import.meta.dirname, './src/const.ts'),
            components: path.resolve(import.meta.dirname, './src/components'),
            interfaces: path.resolve(import.meta.dirname, './src/interfaces'),
            shared: path.resolve(import.meta.dirname, './src/shared'),
            acl: path.resolve(import.meta.dirname, './src/acl.ts'),
            dataProvider: path.resolve(import.meta.dirname, './src/dataProvider.ts'),
            assets: path.resolve(import.meta.dirname, './src/assets'),
            '@feed/shared/planning': path.resolve(import.meta.dirname, '../shared/src/planning/index.ts'),
            '@feed/shared': path.resolve(import.meta.dirname, '../shared/src/index.ts')
        }
    },
    server: {
        port: 3002,
        proxy: {
            '/feedapi': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true
            }
        }
    }
});
