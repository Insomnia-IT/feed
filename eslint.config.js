import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['**/dist', '**/dev-dist', '**/build', '**/.nx', '**/.turbo', '**/node_modules']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite()
        ],
        languageOptions: {
            ecmaVersion: 2023,
            globals: globals.browser
        },
        rules: {
            'no-tabs': 'error',
            quotes: ['error', 'single'],
            'jsx-quotes': ['error', 'prefer-double'],
            'comma-dangle': ['error', 'never'],
            '@typescript-eslint/no-explicit-any': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
        }
    }
]);
