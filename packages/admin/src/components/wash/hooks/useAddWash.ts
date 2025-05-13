import { useMutation } from '@tanstack/react-query';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';

export const useAddWash = () => {
    return useMutation({
        mutationFn: async (data: { volunteer: number; actor: number }) => {
            const response = await axios.post(`${NEW_API_URL}/washes/`, data);
            return response.data;
        }
    });
};
