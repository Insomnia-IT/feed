import { useQuery } from '@tanstack/react-query';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import type { WashesResponse } from '../types';

export const useVolunteerWashes = (volunteerId: number, limit?: number) => {
    return useQuery<WashesResponse>({
        queryKey: ['volunteer-washes', volunteerId, limit],
        queryFn: async () => {
            const params = limit ? { limit } : undefined;

            const { data } = await axios.get<WashesResponse>(`${NEW_API_URL}/volunteers/${volunteerId}/washes`, {
                params
            });

            return data;
        },
        enabled: Number.isFinite(volunteerId)
    });
};
