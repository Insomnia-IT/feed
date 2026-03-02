import Cookies from 'js-cookie';
import axios from 'axios';

import { NEW_API_URL } from 'const';

export const AppRoles = {
    ADMIN: 'ADMIN',
    SENIOR: 'SENIOR',
    CAT: 'CAT',
    SOVA: 'SOVA',
    DIRECTION_HEAD: 'DIRECTION_HEAD'
} as const;

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles];

export interface UserData {
    id?: number | string;
    exp: number;
    iat: number;
    roles: AppRole[];
    directions?: string[];
    username: string;
}

export const AUTH_COOKIE_NAME = 'auth';
export const AUTH_DATA_COOKIE_NAME = 'authData';

type UserDataReturn<T extends boolean> = T extends true ? UserData | null : string | null;

export const getUserData = async <T extends true | false>(decode: T): Promise<UserDataReturn<T>> => {
    const token = Cookies.get(AUTH_COOKIE_NAME);

    if (!token) {
        return null as UserDataReturn<T>;
    }

    axios.defaults.headers.common = {
        Authorization: token.startsWith('V-TOKEN ') ? token : `Token ${token}`
    };

    if (decode) {
        return (await getUserInfo(token)) as UserDataReturn<T>;
    } else {
        return token as UserDataReturn<T>;
    }
};

export const setUserData = (token: string): void => {
    Cookies.set(AUTH_COOKIE_NAME, token, {
        expires: 30,
        path: '/'
    });
    axios.defaults.headers.common = {
        Authorization: token.startsWith('V-TOKEN ') ? token : `Token ${token}`
    };
    clearUserInfo();
};

export const setUserInfo = (user: UserData): void => {
    Cookies.set(AUTH_DATA_COOKIE_NAME, JSON.stringify(user), {
        expires: 30,
        path: '/'
    });
};

let userPromise: Promise<UserData | undefined> | undefined;

export const getUserInfo = async (token: string): Promise<UserData | undefined> => {
    const authData = Cookies.get(AUTH_DATA_COOKIE_NAME);
    if (authData) {
        userPromise = undefined;
        return JSON.parse(authData) as UserData;
    }

    if (userPromise) {
        return userPromise;
    }

    if (token.startsWith('V-TOKEN')) {
        userPromise = axios
            .get(`${NEW_API_URL}/volunteers/?limit=1&qr=${token.replace('V-TOKEN ', '')}`, {
                headers: {
                    Authorization: token
                }
            })
            .then((response) => {
                const { data } = response;
                const { access_role, directions, id, name } = data.results[0];
                const userData: UserData = {
                    username: name,
                    id,
                    roles: [access_role],
                    directions: directions.map(({ id }: { id: string }) => id),
                    exp: 0,
                    iat: 0
                };
                setUserInfo(userData);
                return userData;
            })
            .catch((error) => {
                userPromise = undefined;
                throw error;
            })
            .finally(() => {
                userPromise = undefined;
            });
    } else {
        userPromise = axios
            .get(`${NEW_API_URL}/auth/user/`, {
                headers: {
                    Authorization: `Token ${token}`
                }
            })
            .then((response) => {
                const { data } = response;
                setUserInfo(data);
                return data;
            })
            .catch((error) => {
                userPromise = undefined;
                throw error;
            })
            .finally(() => {
                userPromise = undefined;
            });
    }

    return userPromise;
};

export const clearUserData = (): void => {
    Cookies.remove(AUTH_COOKIE_NAME);
    clearUserInfo();
};

export const clearUserInfo = (): void => {
    Cookies.remove(AUTH_DATA_COOKIE_NAME);
};
