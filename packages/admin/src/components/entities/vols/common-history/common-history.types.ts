import { STATUS_MAP } from './utils';

export interface IData {
    comment: string;
    direction_head_comment: string;
    kitchen: string;
    feed: string;
    feed_type: string;
    main_role: string;
    access_role: string;
    color_type: string;
    first_name: string;
    gender: string;
    last_name: string;
    name: string;
    phone: string;
    position: string;
    vegan: boolean;
    departure_transport: string;
    arrival_transport: string;
    status: string;
    departure_date: string;
    arrival_date: string;
    is_blocked: boolean;
    custom_field: string;
    // проверить поля ниже
    group_badge: string;
    directions: string[];
    value: string;
    is_ticket_received: boolean;
    [key: string]: any;
}

interface IActor {
    id: number;
    name: string;
}

type IVolunteer = IActor;

export interface IResult {
    action_at: string;
    actor: IActor | null;
    actor_badge: string;
    by_sync: boolean;
    data: IData;
    object_name: 'arrival' | 'volunteer' | 'volunteercustomfieldvalue';
    status: keyof typeof STATUS_MAP;
    old_data: IData;
    volunteer: IVolunteer;
    group_operation_uuid?: string;
}
