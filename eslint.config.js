import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = (...p) => path.resolve(__dirname, ...p);

export default [
    { ignores: ['**/dist', '**/dev-dist', '**/build', '**/.nx', '**/.turbo', '**/node_modules'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['packages/*/src/**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: [r('tsconfig.eslint.json')]
            }
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'no-tabs': ['error'],
            quotes: ['error', 'single'],
            'jsx-quotes': ['error', 'prefer-double'],
            'comma-dangle': ['error', 'never'],
            '@typescript-eslint/no-explicit-any': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
        }
    }
];
