import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts']
    },
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
    }
});
