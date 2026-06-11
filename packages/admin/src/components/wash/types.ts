import type { VolEntity, WashEntity } from 'interfaces';

export interface VolunteersResponse {
    count: number;
    results: VolEntity[];
}

export interface WashesResponse {
    count: number;
    results: WashEntity[];
}
