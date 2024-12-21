import type { AuthProvider } from '@pankod/refine-core';
import axios from 'axios';

import { clearUserData, getUserData, setUserData } from 'auth';
import { NEW_API_URL } from 'const';

export const authProvider: AuthProvider = {
    login: async ({ isQR, password, username }) => {
        try {
            axios.defaults.headers.common = {};

            if (isQR && username && !password) {
                const token = `V-TOKEN ${username}`;
                const { status } = await axios.get(`${NEW_API_URL}/volunteers/?limit=1&qr=${username}`, {
                    headers: {
                        Authorization: token
                    }
                });

                if (status !== 200) return Promise.reject();

                setUserData(token);
            } else {
                const { data, status } = await axios.post(`${NEW_API_URL}/auth/login/`, {
                    username,
                    password
                });

                if (status !== 200) return Promise.reject();

                const { key } = data;

                setUserData(key);
            }

            return Promise.resolve('/volunteers');
        } catch (e) {
            return Promise.reject(e);
        }
    },
    logout: () => {
        clearUserData();
        return Promise.resolve();
    },
    checkError: () => Promise.resolve(),
    checkAuth: async () => {
        const user = await getUserData(true);

        if (!user) {
            return Promise.reject();
        }

        return Promise.resolve({ user });
    },
    getPermissions: () => Promise.resolve(),
    getUserIdentity: async () => {
        const user = await getUserData(true);
        if (!user) return Promise.reject();

        return Promise.resolve(user);
    }
};

export { axios };
