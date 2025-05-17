import { useQuery } from '@tanstack/react-query';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import { WashesResponse } from '../types';

export const useVolunteerWashes = (volunteerId: number, limit?: number) => {
    return useQuery({
        queryFn: async () => {
            const params = limit ? { limit } : {};
            const response = await axios.get<WashesResponse>(`${NEW_API_URL}/volunteers/${volunteerId}/washes`, {
                params
            });
            return response.data;
        }
    });
};
