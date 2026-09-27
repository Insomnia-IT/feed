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
    }
});
