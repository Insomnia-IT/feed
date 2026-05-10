interface TimeStampedEntity {
    created_at?: string;
    updated_at?: string;
}

export interface VolEntity extends TimeStampedEntity {
    id: number;
    uuid?: string;
    qr?: string | null;
    parent?: number | null;
    gender?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    photo?: string | null;
    photo_local?: string | null;
    position?: string | null;
    is_vegan?: boolean;
    is_blocked?: boolean;
    comment?: string | null;
    directions?: Array<DirectionEntity>;
    kitchen?: number | null;
    color_type?: number | null;
    feed_type?: number | null;
    qr_code?: string | null;
    group_badge?: number | null;
    printing_batch?: number | null;
    main_role?: string | null;
    access_role?: string | null;
    arrivals: Array<ArrivalEntity>;
    paid_arrivals: Array<PaidArrivalEntity>;
    custom_field_values: Array<{ custom_field: number; value: string }>;
    direction_head_comment?: string | null;
    is_ticket_received?: boolean | null;
    badge_number?: string | null;
    scanner_comment?: string | null;
    is_photo_updated?: boolean;
    infant?: boolean | null;
    deleted_at?: string | null;
    supervisor_id?: number | null;
    supervisor?: { id: number; name: string } | null;
    person?: PersonEntity | null;
    person_id?: string | null;
    // Ответственный за волонтера
    responsible_id?: number | null;
    //  Бейдж у руководителя
    is_badge_located_at_leader?: boolean | null;
}

export interface KitchenEntity {
    id: number;
    name: string;
    comment?: string | null;
}

export interface FeedTypeEntity extends TimeStampedEntity {
    id: number;
    name: string;
    code: string;
    paid: boolean;
    daily_amount: number;
    comment?: string | null;
}

export interface ColorTypeEntity extends TimeStampedEntity {
    id: number;
    name: string;
    description?: string | null;
}

export interface VolunteerRoleEntity extends TimeStampedEntity {
    id: string;
    name: string;
    color: string;
    is_leader: boolean;
    is_team: boolean;
    is_group_badge?: boolean;
}

export interface AccessRoleEntity extends TimeStampedEntity {
    id: string;
    name: string;
    description?: string | null;
}

export interface GenderEntity extends TimeStampedEntity {
    id: string;
    name: string;
}

export interface FeedTransactionEntity extends TimeStampedEntity {
    id?: number;
    ulid: string;
    amount: number;
    dtime: string;
    meal_time: MealType;
    volunteer?: number | null;
    is_vegan: boolean | null;
    is_paid?: boolean;
    is_anomaly?: boolean;
    reason?: string | null;
    comment?: string | null;
    kitchen: number;
    kitchen_name?: string | null;
    group_badge?: number | null;
    volunteer_name?: string | null;
    volunteer_first_name?: string | null;
    volunteer_last_name?: string | null;
    volunteer_directions?: Array<string> | null;
    group_badge_name?: string | null;
}

/** Ответ эндпоинта GET v1/feed-transaction/anomalies (dtime_from, dtime_to) */
export interface FeedTransactionAnomaly {
    group_badge_name: string | null;
    direction_name: string | null;
    direction_amount: number | null;
    calculated_amount: number | null;
    real_amount: number;
    problem: string;
}

export interface GroupBadgeEntity extends TimeStampedEntity {
    id: number;
    qr: string | null;
    direction: DirectionEntity | null;
    role: string | null;
    name: string;
    comment: string | null;
    volunteer_count: number;
    planning_cells: MealPlanCell[];
    deleted_at: string | null;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'night';

export interface GroupBadgePlanningCellEntity extends MealPlanCell {
    group_badge_name?: string | null;
    meal_time: MealType;
}

export interface VolunteerCustomFieldEntity extends TimeStampedEntity {
    id: number;
    name: string;
    type: string;
    comment?: string | null;
    mobile: boolean;
}

export interface StorageEntity {
    id: number;
    name: string;
    description?: string;
}

export interface BinEntity {
    id: number;
    storage: number;
    name: string;
    capacity?: number;
    description?: string;
}

export interface ItemEntity {
    id: number;
    name: string;
    sku?: string;
    is_unique: boolean;
    is_anonymous: boolean;
    storage?: number;
    storage_name?: string;
    metadata?: any;
}

export interface StorageItemPositionEntity {
    id: number;
    storage: number;
    bin: number;
    item: number;
    count: number;
    description?: string;
    item_name?: string;
    item_is_unique?: boolean;
    item_is_anonymous?: boolean;
    bin_name?: string;
    storage_name?: string;
}

export interface IssuanceEntity {
    id: number;
    position: number;
    volunteer: number;
    count: number;
    notes?: string;
    volunteer_name?: string;
    item_name?: string;
}

export interface ReceivingEntity {
    id: number;
    position: number;
    volunteer: number;
    count: number;
    notes?: string;
    volunteer_name?: string;
    item_name?: string;
}

export interface DirectionEntity extends TimeStampedEntity {
    id: string;
    name: string;
    type: DirectionTypeEntity;
    first_year: number | null;
    last_year: number | null;
    comment: string | null;
}
export interface DirectionTypeEntity extends TimeStampedEntity {
    id: string;
    name: string;
    is_federal: boolean;
}

export interface CustomFieldEntity extends TimeStampedEntity {
    id: number;
    name: string;
    type: string;
    comment?: string | null;
    mobile: boolean;
}

export interface VolCustomFieldValueEntity extends TimeStampedEntity {
    id: number;
    volunteer: number;
    custom_field: number;
    value: string;
}

export interface TransportEntity extends TimeStampedEntity {
    id: string;
    name: string;
}

export interface StatusEntity extends TimeStampedEntity {
    id: string;
    name: string;
    visible: string;
    description: string;
}

export interface ArrivalEntity extends TimeStampedEntity {
    id: string;
    arrival_date: string;
    arrival_transport?: string | null;
    arrival_registered?: string | null;
    departure_date: string;
    departure_transport?: string | null;
    departure_registered?: string | null;
    status?: string | null;
    comment?: string | null;
}

export interface PaidArrivalEntity extends TimeStampedEntity {
    id: string;
    arrival_date: string;
    departure_date: string;
    is_free: boolean;
    comment?: string | null;
}

interface EngagementEntity {
    id: string;
    year: number;
    direction: {
        id: string;
        name: string;
    };
    role: {
        id: string;
        name: string;
    };
    position?: string | null;
    status?: string | null;
}

export interface PersonEntity extends TimeStampedEntity {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    nickname?: string | null;
    other_names?: string | null;
    birth_date?: string | null;
    city?: string | null;
    telegram?: string | null;
    phone?: string | null;
    email?: string | null;
    gender?: string | null;
    is_vegan?: boolean;
    banned?: boolean | null;
    comment?: string | null;
    deleted_at?: string | null;
    engagements: EngagementEntity[];
}

export interface WashEntity {
    id: number;
    created_at: string;
    updated_at: string;
    volunteer: VolEntity;
    actor: VolEntity;
    wash_count: number;
}

export interface MealPlanCell {
    id?: number;
    group_badge: number;
    group_badge_name?: string | null;
    created_at?: string;
    updated_at?: string;
    date: string;
    meal_time: MealType;
    amount_meat: number | null;
    amount_vegan: number | null;
}
