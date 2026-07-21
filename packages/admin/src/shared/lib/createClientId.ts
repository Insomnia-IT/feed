export const createClientId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    throw new Error('This browser does not support crypto.randomUUID');
};
