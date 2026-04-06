export interface VolEntity {
    id: number;
    custom_field_values: Array<{ custom_field: number; value: string }>;
    uuid?: string;
    qr?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    email?: string;
    photo?: string;
    photo_local?: string;
    position?: string;
    is_vegan?: boolean; // nutritionType
    is_blocked?: boolean;
    comment?: string;
    directions?: Array<DirectionEntity>;
    kitchen?: number;
    // location?: LocationEntity[];
    color_type?: number; //BadgeType
    feed_type?: number; //FeedTypeEntity;
    qr_code?: string;
    group_badge?: number | undefined;
    printing_batch?: number;
    main_role?: string;
    access_role?: string;
    arrivals: Array<ArrivalEntity>;
    paid_arrivals: Array<PaidArrivalEntity>;
    direction_head_comment?: string;
    is_ticket_received?: boolean;
    supervisor_id?: number | null;
    supervisor?: { id: number; name: string } | null;
}

export interface KitchenEntity {
    id: number;
    name: string;
}

export interface FeedTypeEntity {
    id: number;
    name: string;
    code?: string;
    paid?: boolean;
}

export interface ColorTypeEntity {
    id: number;
    name: string;
    description: string;
}

export interface VolunteerRoleEntity {
    id: string;
    name: string;
    color: string;
    is_leader: boolean;
    is_team: boolean;
}

export interface AccessRoleEntity {
    id: string;
    name: string;
    description: string;
}

export interface FeedTransactionEntity {
    id: number;
    ulid: string;
    amount: number;
    dtime: string;
    meal_time: string;
    volunteer: number;
    is_vegan: boolean | null;
    is_paid: boolean | null;
    reason: string | null;
    kitchen: number;
    kitchen_name?: string | null;
    group_badge?: number;
    volunteer_name?: string;
    volunteer_first_name?: string | null;
    volunteer_last_name?: string | null;
    volunteer_directions?: Array<string> | null;
    group_badge_name?: string | null;
}

export interface GroupBadgeEntity {
    id: number;
    qr: string;
    direction?: DirectionEntity;
    role?: string;
    name: string;
    comment?: string;
    /* Количество волонтеров в бейдже */
    volunteer_count: number;

    /* Планирование питания */
    planning_cells: MealPlanCell[];
}

export interface VolunteerCustomFieldEntity {
    id: number;
    name: string;
    comment?: string;
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

export interface DirectionEntity {
    id: string;
    name: string;
    type: {
        id: string;
        name: string;
    };
    first_year: number;
    last_year: number;
}

export interface DirectionTypeEntity {
    id: string;
    name: string;
    is_federal: boolean;
}

export interface CustomFieldEntity {
    id: number;
    name: string;
    type: string;
    comment: string;
    mobile: boolean;
}

export interface VolCustomFieldValueEntity {
    id: number;
    volunteer: number;
    custom_field: number;
    value: string;
}

export interface TransportEntity {
    id: number;
    name: string;
}

export interface StatusEntity {
    id: string;
    name: string;
    visible: boolean;
    description: string;
}

export interface ArrivalEntity {
    id: string;
    arrival_date: string;
    arrival_transport: string;
    departure_date: string;
    departure_transport: string;
    status: string;
}

export interface PaidArrivalEntity {
    id: string;
    arrival_date: string;
    departure_date: string;
    is_free: boolean;
}

interface EngagementEntity {
    id: string;
    year: number;
    direction: {
        name: string;
    };
    role: {
        name: string;
    };
}

export interface PersonEntity {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    nickname?: string;
    other_names?: string;
    phone?: string;
    email?: string;
    is_vegan?: boolean;
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
    group_badge_name: string;
    created_at: string;
    updated_at: string;
    date: string;
    meal_time: string;
    amount_meat: number | null;
    amount_vegan: number | null;
}
