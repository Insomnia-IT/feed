import { useQuery } from '@tanstack/react-query';
import { axios } from 'authProvider';
import type { VolunteersResponse } from '../types';
import { NEW_API_URL } from 'const';

export const useSearchVolunteer = (qr?: string) => {
    return useQuery({
        queryFn: async () => {
            const { data } = await axios.get<VolunteersResponse>(`${NEW_API_URL}/volunteers/`, {
                params: { qr }
            });

            return data.results[0];
        },
        queryKey: [qr]
    });
};
