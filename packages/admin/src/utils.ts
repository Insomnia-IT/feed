export const getSorter = (field: string) => {
    return (a: { [x: string]: any }, b: { [x: string]: any }) => {
        const x = a[field] ?? '';
        const y = b[field] ?? '';

        if (x < y) {
            return -1;
        }
        if (x > y) {
            return 1;
        }
        return 0;
    };
};

export const isServer = typeof window === 'undefined';

export const isBrowser = !isServer;
