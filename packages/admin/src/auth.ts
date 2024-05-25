import nookies from 'nookies';
import axios from 'axios';

import { NEW_API_URL } from '~/const';

export enum AppRoles {
    ADMIN = 'ADMIN',
    SENIOR = 'SENIOR',
    CAT = 'CAT',
    DIRECTION_HEAD = 'DIRECTION_HEAD'
}

export interface UserData {
    id?: number | string;
    exp: number;
    iat: number;
    roles: Array<AppRoles.ADMIN | AppRoles.SENIOR | AppRoles.CAT | AppRoles.DIRECTION_HEAD>;
    directions?: Array<string>;
    username: string;
}

export const AUTH_COOKIE_NAME = 'auth';
export const AUTH_DATA_COOKIE_NAME = 'authData';

type UserDataReturn<T extends boolean> = (T extends true ? UserData : string) | null;
export const getUserData = async <T extends true | false>(ctx, decode: T): Promise<UserDataReturn<T>> => {
    const cookies = nookies.get(ctx);
    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) {
        return null;
    }

    axios.defaults.headers.common = {
        Authorization: token.startsWith('V-TOKEN ') ? token : `Token ${token}`
    };

    return decode
        ? Promise.resolve(
              <UserDataReturn<T>>await getUserInfo(token)
          ) /* <UserDataReturn<T>>jwt_decode<UserData>(token)*/
        : Promise.resolve(<UserDataReturn<T>>token);
};

export const setUserData = (token: string): void => {
    nookies.set(null, AUTH_COOKIE_NAME, token, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/'
    });
    axios.defaults.headers.common = {
        Authorization: token.startsWith('V-TOKEN ') ? token : `Token ${token}`
    };
    clearUserInfo();
};

export const setUserInfo = (user: UserData): void => {
    nookies.set(null, AUTH_DATA_COOKIE_NAME, JSON.stringify(user), {
        maxAge: 30 * 24 * 60 * 60,
        path: '/'
    });
};

let userPromise: Promise<UserData | undefined> | undefined;

export const getUserInfo = async (token: string): Promise<UserData | undefined> => {
    const authData = nookies.get({})[AUTH_DATA_COOKIE_NAME];
    if (authData) {
        return JSON.parse(authData) as UserData;
    }
    userPromise =
        userPromise ||
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        new Promise(async (resolve, reject) => {
            try {
                if (token.startsWith('V-TOKEN')) {
                    const { data } = await axios.get(
                        `${NEW_API_URL}/volunteers/?limit=1&qr=${token.replace('V-TOKEN ', '')}`,
                        {
                            headers: {
                                Authorization: token
                            }
                        }
                    );
                    const { access_role, id, name, directions } = data.results[0];
                    const userData: UserData = {
                        username: name,
                        id: id,
                        roles: [access_role],
                        directions: directions.map(({ id }) => id),
                        exp: 0,
                        iat: 0
                    };

                    setUserInfo(userData);

                    resolve(userData);
                } else {
                    const { data } = await axios.get(`${NEW_API_URL}/auth/user/`, {
                        headers: {
                            Authorization: `Token ${token}`
                        }
                    });

                    setUserInfo(data);

                    resolve(data);
                }
            } catch (e) {
                reject(e);
            } finally {
                userPromise = undefined;
            }
        });

    return await userPromise;
};

export const clearUserData = (): void => {
    nookies.destroy(null, AUTH_COOKIE_NAME);
    clearUserInfo();
};

export const clearUserInfo = (): void => {
    nookies.destroy(null, AUTH_DATA_COOKIE_NAME);
};
