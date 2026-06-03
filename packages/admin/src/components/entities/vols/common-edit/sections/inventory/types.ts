import type { StorageItemPositionEntity, VolunteerInventoryEntity } from 'interfaces';

export interface InventoryRow extends VolunteerInventoryEntity {
    positionData?: StorageItemPositionEntity;
}

export interface TransferFormValues {
    from: number;
    position: number;
    count: number;
}

export interface InventorySectionProps {
    volunteerId?: number;
    volunteerName?: string | null;
    isCreationProcess: boolean;
}
