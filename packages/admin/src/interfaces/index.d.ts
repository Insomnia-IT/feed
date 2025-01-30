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
    direction_head_comment?: string;
}

export interface KitchenEntity {
    id: number;
    name: string;
}

export interface FeedTypeEntity {
    id: number;
    name: string;
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
    reason: string;
    kitchen: number;
    group_badge?: number;
}

export interface GroupBadgeEntity {
    id: number;
    qr: string;
    direction?: DirectionEntity;
    name: string;
    comment?: string;
    /* Количество волонтеров в бейдже */
    volunteer_count: number;
}

export interface VolunteerCustomFieldEntity {
    id: number;
    name: string;
    comment?: string;
    mobile: boolean;
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
