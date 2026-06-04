import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import type { StorageItemPositionEntity, VolunteerInventoryEntity } from 'interfaces';

import type { InventoryRow } from './types';

export const getVolunteerInventory = async (volunteerId: number): Promise<InventoryRow[]> => {
    const { data: inventory } = await axios.get<VolunteerInventoryEntity[]>(
        `${NEW_API_URL}/volunteer-inventory/${volunteerId}`
    );
    const positions = await Promise.all(
        inventory.map(({ position }) =>
            axios
                .get<StorageItemPositionEntity>(`${NEW_API_URL}/storage-positions/${position}/`)
                .then(({ data }) => data)
        )
    );
    const positionsById = new Map(positions.map((position) => [position.id, position]));

    return inventory.map((item) => ({
        ...item,
        positionData: positionsById.get(item.position)
    }));
};

export const createInventoryMovement = (params: {
    position: number;
    count: number;
    from: number;
    to: number;
    actor?: number;
}) => axios.post(`${NEW_API_URL}/storage-movements/`, params);
