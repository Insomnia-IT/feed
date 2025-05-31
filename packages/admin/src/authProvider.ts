import type { AuthActionResponse, AuthProvider, HttpError } from '@refinedev/core';
import axios from 'axios';

import { AppRoles, clearUserData, getUserData, setUserData } from 'auth';
import { NEW_API_URL } from 'const';

export const authProvider: AuthProvider = {
    login: async ({ username, password, isQR }): Promise<AuthActionResponse> => {
        try {
            axios.defaults.headers.common = {};

            if (isQR && username && !password) {
                const token = `V-TOKEN ${username}`;
                const { status } = await axios.get(`${NEW_API_URL}/volunteers/?limit=1&qr=${username}`, {
                    headers: { Authorization: token }
                });

                if (status !== 200) {
                    return {
                        success: false,
                        error: {
                            name: 'LoginError',
                            message: 'Invalid QR code or status'
                        }
                    };
                }

                setUserData(token);
            } else {
                const { data, status } = await axios.post(`${NEW_API_URL}/auth/login/`, {
                    username,
                    password
                });

                if (status !== 200) {
                    return {
                        success: false,
                        error: {
                            name: 'LoginError',
                            message: 'Invalid username or password'
                        }
                    };
                }

                const { key } = data;

                setUserData(key);
            }

            const user = await getUserData(true);

            return {
                success: true,
                redirectTo: user?.roles[0] === AppRoles.SOVA ? '/wash' : '/volunteers'
            };
        } catch (error) {
            return {
                success: false,
                error: error as HttpError | Error
            };
        }
    },

    logout: async () => {
        clearUserData();

        return {
            success: true,
            redirectTo: '/login'
        };
    },

    check: async () => {
        const user = await getUserData(true);
        if (!user) {
            return {
                authenticated: false,
                redirectTo: '/login'
            };
        }
        return {
            authenticated: true
        };
    },

    getPermissions: async () => null,

    getIdentity: async () => {
        const user = await getUserData(true);
        if (!user) return null;
        return user;
    },

    onError: async (error) => {
        console.error(error);
        return { error };
    }
};

export { axios };
