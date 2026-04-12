import type { ReactNode } from 'react';
import { STATUS_MAP } from './utils';

type HistorySupervisorValue = {
    id: number;
    name: string;
};

export type HistoryIntervalValue = {
    id?: string;
    arrival_date?: string;
    departure_date?: string;
    is_free?: boolean;
};

type HistoryPrimitiveValue = string | number | boolean | null | undefined;

export interface IHistoryChangeData {
    id?: string | number;
    badge?: string;
    deleted?: boolean;
    comment?: string;
    direction_head_comment?: string;
    kitchen?: string | number;
    feed?: string;
    feed_type?: string | number;
    main_role?: string;
    access_role?: string;
    color_type?: string | number;
    first_name?: string;
    gender?: string | number;
    last_name?: string;
    name?: string;
    phone?: string;
    position?: string;
    vegan?: boolean;
    departure_transport?: string | number;
    arrival_transport?: string | number;
    status?: string;
    departure_date?: string;
    arrival_date?: string;
    is_blocked?: boolean;
    custom_field?: string | number;
    group_badge?: string | number;
    directions?: Array<string | number>;
    value?: string;
    ticket?: boolean;
    supervisor_id?: string | null;
    supervisor?: HistorySupervisorValue;
    paid_arrivals?: HistoryIntervalValue[];
    [key: string]: HistoryPrimitiveValue | Array<string | number> | HistoryIntervalValue[] | HistorySupervisorValue;
}

type HistoryActor = {
    id: number;
    name: string;
};

export interface IHistoryRecord {
    id: number;
    action_at: string;
    actor: HistoryActor | null;
    actor_badge: string | null;
    by_sync: boolean;
    data: IHistoryChangeData;
    object_name: 'arrival' | 'paidarrival' | 'volunteer' | 'volunteercustomfieldvalue';
    status: keyof typeof STATUS_MAP;
    old_data: IHistoryChangeData | null;
    volunteer: HistoryActor | null;
    group_operation_uuid?: string;
}

export type HistoryFieldEntry = {
    key: string;
    label: string;
    oldValue: ReactNode;
    newValue: ReactNode;
};

export type HistoryViewModel = {
    key: string;
    actorLabel: string;
    actorRouteId?: number;
    actionAt: string;
    statusLabel: string;
    titleAddition?: string;
    fields: HistoryFieldEntry[];
    groupOperationUuid?: string;
};

export type HistoryLookupMaps = {
    kitchen: Record<string | number, string>;
    main_role: Record<string | number, string>;
    access_role: Record<string | number, string>;
    color_type: Record<string | number, string>;
    feed_type: Record<string | number, string>;
    gender: Record<string | number, string>;
    status: Record<string | number, string>;
    group_badge: Record<string | number, string>;
    arrival_transport: Record<string | number, string>;
    departure_transport: Record<string | number, string>;
};
