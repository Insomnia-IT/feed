import dayjs from 'dayjs';

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
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, normalizeFormValue(nestedValue)])
        );
    }

    return value;
};

export const serializeFormValues = (values: unknown): string => JSON.stringify(normalizeFormValue(values));
