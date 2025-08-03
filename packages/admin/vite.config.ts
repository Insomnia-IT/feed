import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
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
    build: {
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (id.includes('node_modules')) {
                        if (id.includes('recharts')) {
                            return 'vendor_recharts';
                        }
                        if (id.includes('exceljs')) {
                            return 'vendor_exceljs';
                        }
                        if (id.includes('quill')) {
                            return 'vendor_quill';
                        }
                        return 'vendor_base';
                    }
                }
            }
        }
    },
    server: { port: 3002 }
});
