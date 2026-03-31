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
        try {
            return (await getUserInfo(token)) as UserDataReturn<T>;
        } catch (error) {
            if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
                clearUserData();
                return null as UserDataReturn<T>;
            }

            throw error;
        }
    }

    return token as UserDataReturn<T>;
};

export const setUserData = (token: string): void => {
    Cookies.set(AUTH_COOKIE_NAME, token, {
        expires: 30,
        path: '/'
    });
    userRequest = undefined;
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

let userRequest: { token: string; promise: Promise<UserData | undefined> } | undefined;

export const getUserInfo = async (token: string): Promise<UserData | undefined> => {
    const authData = Cookies.get(AUTH_DATA_COOKIE_NAME);
    if (authData) {
        userRequest = undefined;
        return JSON.parse(authData) as UserData;
    }

    if (userRequest?.token === token) {
        return userRequest.promise;
    }

    if (token.startsWith('V-TOKEN')) {
        const promise = axios
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
                throw error;
            })
            .finally(() => {
                if (userRequest?.token === token) {
                    userRequest = undefined;
                }
            });

        userRequest = { token, promise };
    } else {
        const promise = axios
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
                throw error;
            })
            .finally(() => {
                if (userRequest?.token === token) {
                    userRequest = undefined;
                }
            });

        userRequest = { token, promise };
    }

    return userRequest.promise;
};

export const clearUserData = (): void => {
    Cookies.remove(AUTH_COOKIE_NAME);
    userRequest = undefined;
    axios.defaults.headers.common = {};
    clearUserInfo();
};

export const clearUserInfo = (): void => {
    Cookies.remove(AUTH_DATA_COOKIE_NAME);
};
