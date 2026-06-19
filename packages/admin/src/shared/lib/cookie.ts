type SetCookieParams = {
    name: string;
    value: string;
    expiresInDays?: number;
    path?: string;
};

type RemoveCookieParams = {
    name: string;
    path?: string;
};

export const getCookie = (name: string): string | undefined => {
    const encodedName = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(encodedName));

    if (!cookie) {
        return undefined;
    }

    return decodeURIComponent(cookie.slice(encodedName.length));
};

export const setCookie = ({ name, value, expiresInDays, path = '/' }: SetCookieParams): void => {
    const attributes = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, `Path=${path}`];

    if (expiresInDays !== undefined) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        attributes.push(`Expires=${expiresAt.toUTCString()}`);
    }

    document.cookie = attributes.join('; ');
};

export const removeCookie = ({ name, path = '/' }: RemoveCookieParams): void => {
    document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};
