import type { STATUS_MAP } from './utils';

export interface HistoryChangeData {
    comment?: string;
    direction_head_comment?: string;
    kitchen?: string;
    feed?: string;
    feed_type?: string;
    main_role?: string;
    access_role?: string;
    color_type?: string;
    first_name?: string;
    gender?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    position?: string;
    vegan?: boolean;
    departure_transport?: string;
    arrival_transport?: string;
    status?: string;
    departure_date?: string;
    arrival_date?: string;
    is_blocked?: boolean;
    custom_field?: string;
    group_badge?: string;
    directions?: string[];
    value?: string;
    ticket?: boolean;
    supervisor_id?: string | null;
    supervisor?: HistorySupervisorValue;
    paid_arrivals?: HistoryIntervalValue[];
    deleted?: boolean;
    badge?: string;
    id?: string | number;
    [key: string]:
        | string
        | number
        | boolean
        | null
        | undefined
        | string[]
        | HistoryIntervalValue[]
        | HistorySupervisorValue;
}

export type HistoryIntervalValue = {
    id?: string;
    arrival_date?: string;
    departure_date?: string;
    is_free?: boolean;
};

export type HistorySupervisorValue = {
    id: number;
    name: string;
};

interface HistoryActor {
    id: number;
    name: string;
}

type HistoryVolunteer = HistoryActor;

export interface HistoryRecord {
    id: number;
    action_at: string;
    actor: HistoryActor | null;
    actor_badge: string | null;
    by_sync: boolean;
    data: HistoryChangeData;
    object_name: 'arrival' | 'volunteer' | 'volunteercustomfieldvalue' | 'paidarrival';
    status: keyof typeof STATUS_MAP;
    old_data: HistoryChangeData | null;
    volunteer: HistoryVolunteer | null;
    group_operation_uuid?: string;
}
