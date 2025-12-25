export const VOLUNTEER_STATUSES = ['ARRIVED', 'STARTED', 'COMPLETE', 'JOINED', 'SKIPPED', 'LEFT'] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

const ALL_STATUSES = new Set<VolunteerStatus>(VOLUNTEER_STATUSES);

export const isVolunteerStatus = (value: unknown): value is VolunteerStatus =>
    typeof value === 'string' && ALL_STATUSES.has(value as VolunteerStatus);

export const VOLUNTEER_COMPLETED_STATUSES = ['ARRIVED', 'STARTED', 'COMPLETE', 'JOINED'] as const;

export type CompletedVolunteerStatus = (typeof VOLUNTEER_COMPLETED_STATUSES)[number];

const COMPLETED_STATUSES = new Set<VolunteerStatus>(VOLUNTEER_COMPLETED_STATUSES);

export const isVolunteerCompletedStatus = (status: VolunteerStatus): status is CompletedVolunteerStatus =>
    COMPLETED_STATUSES.has(status);

export const isVolunteerCompletedStatusValue = (value: unknown): boolean =>
    isVolunteerStatus(value) && isVolunteerCompletedStatus(value);

const ACTIVATED_STATUSES = new Set<VolunteerStatus>(['ARRIVED', 'STARTED', 'JOINED']);

export const isVolunteerActivatedStatus = (status: VolunteerStatus): boolean => ACTIVATED_STATUSES.has(status);

export const isVolunteerActivatedStatusValue = (value: unknown): boolean =>
    isVolunteerStatus(value) && isVolunteerActivatedStatus(value);

export const VOLUNTEER_STATUS_ORDER_BASE = ['STARTED', 'COMPLETE', 'SKIPPED', 'LEFT', 'JOINED'] as const;

export const VOLUNTEER_STATUS_ORDER_WITH_ARRIVED = ['ARRIVED', ...VOLUNTEER_STATUS_ORDER_BASE] as const;

export const getVolunteerStatusOrder = (includeArrived: boolean) =>
    includeArrived ? VOLUNTEER_STATUS_ORDER_WITH_ARRIVED : VOLUNTEER_STATUS_ORDER_BASE;
