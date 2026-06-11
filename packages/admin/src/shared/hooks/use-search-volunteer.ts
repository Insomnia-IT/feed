import { useQuery } from '@tanstack/react-query';
import type { VolEntity } from 'interfaces';
import { dataProvider } from 'dataProvider';

export const useSearchVolunteer = (qr?: string) => {
    return useQuery({
        queryFn: async () => {
            const list = await dataProvider.getList<VolEntity>({
                filters: [{ field: 'qr', value: qr, operator: 'eq' }],
                resource: 'volunteers'
            });

            return list.data[0];
        },
        queryKey: ['volunteer-by-qr', qr],
        enabled: !!qr
    });
};
