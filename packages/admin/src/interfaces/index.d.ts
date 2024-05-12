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
    daily_eats?: number;
    comment?: string;
    ref_to?: number; // chef
    departments?: Array<{ id: number; name: string }>; //DepartmentEntity[];
    kitchen?: number;
    // location?: LocationEntity[];
    color_type?: number; //BadgeType
    feed_type?: number; //FeedTypeEntity;
    qr_code?: string;
    group_badge?: number | undefined;
    kitchen?: number;
    printing_batch?: number;
    role?: string;
    access_role?: string;
    arrivals: Array<ArrivalEntity>;
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
}

export interface GroupBadgeEntity {
    id: number;
    qr: string;
    name: string;
    comment?: string;
}

export interface VolunteerCustomFieldEntity {
    id: number;
    name: string;
    comment?: string;
}

export interface DepartmentEntity {
    id: number;
    name: string;
    lead: number | null;
}

export interface LocationEntity {
    id: number;
    name: string;
    vol: VolEntity;
}

export interface CustomFieldEntity {
    id: number;
    name: string;
    type: string;
    comment: string;
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
