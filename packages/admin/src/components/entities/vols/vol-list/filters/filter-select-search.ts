import type { FilterListItem } from './filter-types';

const normalizeFilterSelectText = (value: unknown): string =>
    String(value ?? '')
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .replace(/ё/gi, 'е')
        .toLocaleLowerCase('ru-RU')
        .trim();

export const filterSelectOptionMatches = (input: string, option?: FilterListItem): boolean => {
    const search = normalizeFilterSelectText(input);

    if (!search) {
        return true;
    }

    const optionText = normalizeFilterSelectText(option?.label ?? option?.text ?? option?.value);

    return optionText.includes(search);
};
