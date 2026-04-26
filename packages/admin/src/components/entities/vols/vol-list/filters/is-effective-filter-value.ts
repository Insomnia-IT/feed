/** Whether a filter item contributes to the API query (non-empty value). */
export const isEffectiveFilterValue = (value: unknown): boolean => {
    if (value == null) {
        return false;
    }
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return true;
};
