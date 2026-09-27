import { afterEach, describe, expect, it } from 'vitest';

import { getCookie, removeCookie, setCookie } from './cookie';

const COOKIE_NAME = 'auth';

afterEach(() => {
    removeCookie({ name: COOKIE_NAME });
});

describe('cookie helpers', () => {
    it('stores and reads encoded values', () => {
        const value = 'V-TOKEN token with spaces';

        setCookie({ name: COOKIE_NAME, value, expiresInDays: 30 });

        expect(getCookie(COOKIE_NAME)).toBe(value);
    });

    it('returns undefined for a missing cookie', () => {
        expect(getCookie('missing')).toBeUndefined();
    });

    it('removes a cookie', () => {
        setCookie({ name: COOKIE_NAME, value: 'token' });

        removeCookie({ name: COOKIE_NAME });

        expect(getCookie(COOKIE_NAME)).toBeUndefined();
    });
});
