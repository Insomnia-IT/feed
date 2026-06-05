import type { CrudFilters } from '@refinedev/core';

import { AppRoles } from 'auth';
import { VOLUNTEER_ROLE_TEAM_LEAD } from 'shared/constants/volunteer-role';

const appendSearchFilter = (search: string): CrudFilters =>
    search
        ? [
              {
                  field: 'search',
                  operator: 'eq' as const,
                  value: search
              }
          ]
        : [];

/** Волонтёры с ролью «Бригадир» (main_role). */
export const buildSupervisorListFiltersByMainRole = (search: string): CrudFilters => [
    {
        field: 'main_role',
        operator: 'eq',
        value: VOLUNTEER_ROLE_TEAM_LEAD
    },
    ...appendSearchFilter(search)
];

/** Волонтёры с правом доступа руководителя направления (исторический критерий бригадира). */
export const buildSupervisorListFiltersByAccessRole = (search: string): CrudFilters => [
    {
        field: 'access_role',
        operator: 'eq',
        value: AppRoles.DIRECTION_HEAD
    },
    ...appendSearchFilter(search)
];
