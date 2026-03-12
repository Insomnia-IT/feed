import {
    VOLUNTEER_STATUSES,
    VOLUNTEER_COMPLETED_STATUSES,
    VOLUNTEER_STATUS_ORDER_BASE,
    VOLUNTEER_STATUS_ORDER_WITH_ARRIVED,
    type VolunteerStatus,
    type CompletedVolunteerStatus
} from '../constants/volunteer-status';

const ALL_STATUSES = new Set<VolunteerStatus>(VOLUNTEER_STATUSES);

export const isVolunteerStatus = (value: unknown): value is VolunteerStatus =>
    typeof value === 'string' && ALL_STATUSES.has(value as VolunteerStatus);

const COMPLETED_STATUSES = new Set<VolunteerStatus>(VOLUNTEER_COMPLETED_STATUSES);

export const isVolunteerCompletedStatus = (status: VolunteerStatus): status is CompletedVolunteerStatus =>
    COMPLETED_STATUSES.has(status);

export const isVolunteerCompletedStatusValue = (value: unknown): boolean =>
    isVolunteerStatus(value) && isVolunteerCompletedStatus(value);

const ACTIVATED_STATUSES = new Set<VolunteerStatus>(['ARRIVED', 'STARTED', 'JOINED']);

export const isVolunteerActivatedStatus = (status: VolunteerStatus): boolean => ACTIVATED_STATUSES.has(status);

export const isVolunteerActivatedStatusValue = (value: unknown): boolean =>
    isVolunteerStatus(value) && isVolunteerActivatedStatus(value);

export const getVolunteerStatusOrder = (includeArrived: boolean) =>
    includeArrived ? VOLUNTEER_STATUS_ORDER_WITH_ARRIVED : VOLUNTEER_STATUS_ORDER_BASE;
