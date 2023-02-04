import jwt_decode from 'jwt-decode';
import nookies from 'nookies';

export enum AppRoles {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR'
}

export interface UserData {
    id?: number | string;
    exp: number;
    iat: number;
    roles: Array<AppRoles>;
    username: string;
}

export const AUTH_COOKIE_NAME = 'auth';

type UserDataReturn<T extends boolean> = (T extends true ? UserData : string) | null;
export const getUserData = <T extends true | false>(ctx, decode: T): UserDataReturn<T> => {
    const cookies = nookies.get(ctx);
    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) return null;

    return decode ? <UserDataReturn<T>>jwt_decode<UserData>(token) : <UserDataReturn<T>>token;
};

export const setUserData = (token: string): void => {
    nookies.set(null, AUTH_COOKIE_NAME, token, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/'
    });
};

export const clearUserData = (): void => {
    nookies.destroy(null, AUTH_COOKIE_NAME);
};
