import type { AuthProvider } from '@pankod/refine-core';
import axios from 'axios';

import { clearUserData, getUserData, setUserData } from '~/auth';
import { API_URL } from '~/const';

export const authProvider: AuthProvider = {
    login: async ({ password, username }) => {
        try {
            const { data, status } = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });

            if (status !== 200) return Promise.reject();

            const { accessToken } = data;

            setUserData(accessToken);

            axios.defaults.headers.common = {
                Authorization: `Bearer ${accessToken}`
            };

            return Promise.resolve('/');
        } catch (e) {
            return Promise.reject(e);
        }
    },
    logout: () => {
        clearUserData();
        return Promise.resolve();
    },
    checkError: () => Promise.resolve(),
    checkAuth: async (ctx) => {
        const token = getUserData(ctx, false);

        if (!token) {
            return Promise.reject();
        }

        try {
            const { data } = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            axios.defaults.headers.common = {
                Authorization: `Bearer ${token}`
            };

            return Promise.resolve({ user: data });
        } catch (error) {
            return Promise.reject(error);
        }
    },
    getPermissions: () => Promise.resolve(),
    getUserIdentity: async (ctx) => {
        const user = getUserData(ctx, true);

        if (!user) return Promise.reject();

        return Promise.resolve({ ...user });
    }
};

export { axios };
