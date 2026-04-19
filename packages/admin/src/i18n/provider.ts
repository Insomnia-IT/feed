import type { I18nProvider } from '@refinedev/core';

import { ruMessages } from './ru';

interface TranslationTree {
    [key: string]: string | TranslationTree;
}

type TranslationNode = string | TranslationTree;

type TranslationParams = Record<string, string | number | boolean | null | undefined>;

const DEFAULT_LOCALE = 'ru' as const;

const isTranslationTree = (value: TranslationNode | undefined): value is TranslationTree =>
    typeof value === 'object' && value !== null;

const getByPath = (value: TranslationTree, path: string[]): string | undefined => {
    let current: TranslationNode | undefined = value;

    for (const key of path) {
        if (!isTranslationTree(current)) {
            return undefined;
        }

        current = current[key];
    }

    return typeof current === 'string' ? current : undefined;
};

const getResourceLabel = (key: string) => {
    const resourceNode = ruMessages[key];

    if (!isTranslationTree(resourceNode)) {
        return undefined;
    }

    const label = resourceNode.label;

    return typeof label === 'string' ? label : undefined;
};

const isTranslationParams = (value: unknown): value is TranslationParams =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const interpolate = (message: string, params?: TranslationParams) => {
    if (!params) {
        return message;
    }

    return Object.entries(params).reduce((result, [key, value]) => {
        return result.replaceAll(`{{${key}}}`, String(value));
    }, message);
};

export const i18nProvider: I18nProvider = {
    translate: (key, options, defaultMessage) => {
        const path = key.split('.');
        const message =
            getByPath(ruMessages, path) ??
            (path.length === 1 ? getResourceLabel(key) : undefined) ??
            (path.length === 2 && path[0] === path[1] ? getResourceLabel(path[0]) : undefined) ??
            defaultMessage ??
            (typeof options === 'string' ? options : undefined);

        if (!message) {
            return key;
        }

        return interpolate(message, isTranslationParams(options) ? options : undefined);
    },
    changeLocale: async () => undefined,
    getLocale: () => DEFAULT_LOCALE
};

export type { TranslationTree, TranslationNode };
