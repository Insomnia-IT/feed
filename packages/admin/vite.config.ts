import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']]
            }
        }),
        // visualizer({ open: true }), // Uncomment to visualize bundle size
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Admin Front',
                short_name: 'Admin',
                description: 'Панель администратора',
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
                        purpose: 'maskable'
                    },
                    {
                        src: 'web-app-manifest-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
            }
        })
    ],
    resolve: {
        alias: {
            utils: path.resolve(__dirname, './src/utils.ts'),
            auth: path.resolve(__dirname, './src/auth.ts'),
            authProvider: path.resolve(__dirname, './src/authProvider.ts'),
            const: path.resolve(__dirname, './src/const.ts'),
            components: path.resolve(__dirname, './src/components'),
            interfaces: path.resolve(__dirname, './src/interfaces'),
            shared: path.resolve(__dirname, './src/shared'),
            acl: path.resolve(__dirname, './src/acl.ts'),
            dataProvider: path.resolve(__dirname, './src/dataProvider.ts'),
            assets: path.resolve(__dirname, './src/assets')
        }
    },
    server: { port: 3002 }
});
