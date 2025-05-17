import { VolEntity } from 'interfaces';

export interface VolunteersResponse {
    count: number;
    results: VolEntity[];
}

interface Wash {
    id: number;
    volunteer_id: number;
    actor_id: number;
    created_at: string;
}

export interface WashesResponse {
    count: number;
    results: Wash[];
}
