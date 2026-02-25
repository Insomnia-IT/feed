export const VOLUNTEER_STATUSES = ['ARRIVED', 'STARTED', 'COMPLETE', 'JOINED', 'SKIPPED', 'LEFT'] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

export const VOLUNTEER_COMPLETED_STATUSES = ['ARRIVED', 'STARTED', 'COMPLETE', 'JOINED'] as const;

export type CompletedVolunteerStatus = (typeof VOLUNTEER_COMPLETED_STATUSES)[number];

export const VOLUNTEER_STATUS_ORDER_BASE = ['STARTED', 'COMPLETE', 'SKIPPED', 'LEFT', 'JOINED'] as const;

export const VOLUNTEER_STATUS_ORDER_WITH_ARRIVED = ['ARRIVED', ...VOLUNTEER_STATUS_ORDER_BASE] as const;
