export interface VolEntity {
    id: number;
    uuid?: string;
    qr?: string | null;
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
    infant?: boolean | null;
    deleted_at?: string | null;
    supervisor_id?: number | null;
    supervisor?: { id: number; name: string } | null;
    person?: PersonEntity | null;
    person_id?: string | null;
    responsible_id?: number | null;
}

export interface KitchenEntity {
    id: number;
    name: string;
    comment?: string | null;
}

export interface FeedTypeEntity {
    id: number;
    name: string;
    code?: string | null;
    paid?: boolean;
    daily_amount?: number | null;
    comment?: string | null;
}

export interface ColorTypeEntity {
    id: number;
    name: string;
    description?: string | null;
}

export interface VolunteerRoleEntity {
    id: string;
    name: string;
    color: string;
    is_leader: boolean;
    is_team: boolean;
    is_group_badge?: boolean;
}

export interface AccessRoleEntity {
    id: string;
    name: string;
    description?: string | null;
}

export interface FeedTransactionEntity {
    id?: number | string;
    ulid: string;
    amount: number;
    dtime: string;
    meal_time: string;
    volunteer?: number | null;
    is_vegan: boolean | null;
    is_paid?: boolean;
    is_anomaly?: boolean;
    reason?: string | null;
    comment?: string | null;
    kitchen: number;
    created_at?: string;
    updated_at?: string;
    kitchen_name?: string | null;
    group_badge?: number | null;
    volunteer_name?: string | null;
    volunteer_first_name?: string | null;
    volunteer_last_name?: string | null;
    volunteer_directions?: Array<string> | null;
    group_badge_name?: string | null;
    is_anomaly?: boolean;
}

/** Ответ эндпоинта GET v1/feed-transaction/anomalies (dtime_from, dtime_to) */
export interface FeedTransactionAnomaly {
    group_badge_name: string;
    direction_name: string;
    direction_amount: number;
    calculated_amount: number | null;
    real_amount: number;
    problem: string;
}

export interface GroupBadgeEntity {
    id: number;
    qr?: string | null;
    direction?: DirectionEntity | string | null;
    role?: string | null;
    name: string;
    comment?: string | null;
    volunteer_count?: number;
    planning_cells?: MealPlanCell[];
    deleted_at?: string | null;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'night';

export interface GroupBadgePlanningCellEntity extends MealPlanCell {
    group_badge_name?: string | null;
    meal_time: MealType;
}

export interface VolunteerCustomFieldEntity {
    id: number;
    name: string;
    type: string;
    comment?: string | null;
    mobile: boolean;
}

export interface DirectionEntity {
    id: string;
    name: string;
    type: string | DirectionTypeEntity;
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
    comment?: string | null;
    mobile: boolean;
}

export interface VolCustomFieldValueEntity {
    id: number;
    volunteer: number;
    custom_field: number;
    value: string;
}

export interface TransportEntity {
    id: string;
    name: string;
}

export interface StatusEntity {
    id: string;
    name: string;
    visible: string;
    description: string;
}

export interface ArrivalEntity {
    id: string;
    arrival_date: string;
    arrival_transport?: string | null;
    departure_date: string;
    departure_transport?: string | null;
    status?: string | null;
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
        id?: string | number;
        name: string;
    };
    role: {
        id?: string | number;
        name: string;
    };
}

export interface PersonEntity {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    nickname?: string | null;
    other_names?: string | null;
    phone?: string | null;
    email?: string | null;
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
    group_badge_name?: string | null;
    created_at?: string;
    updated_at?: string;
    date: string;
    meal_time: string;
    amount_meat: number | null;
    amount_vegan: number | null;
}
