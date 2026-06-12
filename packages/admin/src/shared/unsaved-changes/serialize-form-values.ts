import dayjs from 'dayjs';

const isEmptyFormValue = (value: unknown): boolean => value === undefined || value === null || value === '';

const normalizeFormValue = (value: unknown): unknown => {
    if (dayjs.isDayjs(value)) {
        return value.format('YYYY-MM-DD');
    }

    if (value instanceof Date) {
        return dayjs(value).format('YYYY-MM-DD');
    }

    if (Array.isArray(value)) {
        return value.map(normalizeFormValue);
    }

    if (value !== null && typeof value === 'object') {
        const normalizedEntries = Object.entries(value)
            .map(([key, nestedValue]) => [key, normalizeFormValue(nestedValue)] as const)
            .filter(([, nestedValue]) => !isEmptyFormValue(nestedValue))
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

        return Object.fromEntries(normalizedEntries);
    }

    return value;
};

export const serializeFormValues = (values: unknown): string => JSON.stringify(normalizeFormValue(values));

export const areFormValuesEqual = (left: unknown, right: unknown): boolean =>
    serializeFormValues(left) === serializeFormValues(right);
