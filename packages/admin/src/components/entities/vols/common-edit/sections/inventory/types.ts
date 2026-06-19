import type { StorageItemPositionEntity, VolunteerInventoryEntity } from 'interfaces';

export interface InventoryRow extends VolunteerInventoryEntity {
    positionData?: StorageItemPositionEntity;
}

export interface TransferFormValues {
    from: number;
    to: number;
    position: number;
    count: number;
}

export interface InventorySectionProps {
    volunteerId?: number;
    volunteerName?: string | null;
    isCreationProcess: boolean;
}

export interface StorageIssueFormValues {
    storage: number;
    position: number;
    count: number;
    notes?: string;
}
