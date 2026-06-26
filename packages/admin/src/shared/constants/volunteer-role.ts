/** PK роли «Бригадир» в справочнике volunteer-roles */
export const VOLUNTEER_ROLE_TEAM_LEAD = 'TEAM_LEAD';
export const VOLUNTEER_ROLE_VOLUNTEER = 'VOLUNTEER';
export const SUPERVISOR_ROLE_IDS = ['TEAM_LEAD', 'ORGANIZER', 'VICE'] as const;
export const DIRECTION_HEAD_EDITABLE_ROLE_IDS = [VOLUNTEER_ROLE_VOLUNTEER, VOLUNTEER_ROLE_TEAM_LEAD] as const;
