/** Положительные статусы заезда (с ✅ в выпадашке карточки). */
export const VOLUNTEER_COMPLETED_STATUSES = ['ARRIVED', 'STARTED', 'COMPLETE', 'JOINED'] as const;

export type CompletedVolunteerStatus = (typeof VOLUNTEER_COMPLETED_STATUSES)[number];

/** Нейтральные статусы заезда (без ✅, внизу списка). */
export const VOLUNTEER_NEUTRAL_STATUSES = ['PLANNED', 'SKIPPED', 'LEFT'] as const;

export type NeutralVolunteerStatus = (typeof VOLUNTEER_NEUTRAL_STATUSES)[number];

export const VOLUNTEER_STATUSES = [...VOLUNTEER_COMPLETED_STATUSES, ...VOLUNTEER_NEUTRAL_STATUSES] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

/** Порядок в выпадашке без «Заехал на поле» (нет права `status_arrived_assign`). */
export const VOLUNTEER_STATUS_ORDER_BASE = ['STARTED', 'COMPLETE', 'JOINED', ...VOLUNTEER_NEUTRAL_STATUSES] as const;

/** Полный порядок: положительные сверху, нейтральные снизу. */
export const VOLUNTEER_STATUS_ORDER_WITH_ARRIVED = [
    ...VOLUNTEER_COMPLETED_STATUSES,
    ...VOLUNTEER_NEUTRAL_STATUSES
] as const;
