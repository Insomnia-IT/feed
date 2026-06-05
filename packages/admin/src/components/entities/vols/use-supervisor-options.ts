import { useMemo } from 'react';
import { useList } from '@refinedev/core';

import type { VolEntity } from 'interfaces';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';

import {
    buildSupervisorListFiltersByAccessRole,
    buildSupervisorListFiltersByMainRole
} from './supervisor-list-filters';

type UseSupervisorOptionsParams = {
    search: string;
    selectedSupervisorId?: number | null;
    selectedSupervisor?: { id: number; name: string } | null;
};

export const useSupervisorOptions = ({
    search,
    selectedSupervisorId,
    selectedSupervisor
}: UseSupervisorOptionsParams) => {
    const pagination = {
        mode: 'server' as const,
        currentPage: 1,
        pageSize: 50
    };

    const { result: byMainRoleResult, query: byMainRoleQuery } = useList<VolEntity>({
        resource: 'volunteers',
        filters: buildSupervisorListFiltersByMainRole(search),
        pagination
    });

    const { result: byAccessRoleResult, query: byAccessRoleQuery } = useList<VolEntity>({
        resource: 'volunteers',
        filters: buildSupervisorListFiltersByAccessRole(search),
        pagination
    });

    const options = useMemo(() => {
        const merged = new Map<number, VolEntity>();

        for (const volunteer of [...(byMainRoleResult.data ?? []), ...(byAccessRoleResult.data ?? [])]) {
            merged.set(volunteer.id, volunteer);
        }

        const list = Array.from(merged.values())
            .sort((left, right) => formatVolunteerLabel(left).localeCompare(formatVolunteerLabel(right), 'ru'))
            .map((volunteer) => ({
                value: volunteer.id,
                label: formatVolunteerLabel(volunteer)
            }));

        if (selectedSupervisorId && !list.some((option) => option.value === selectedSupervisorId)) {
            list.unshift({
                value: selectedSupervisorId,
                label: selectedSupervisor?.name ?? `ID ${selectedSupervisorId}`
            });
        }

        return list;
    }, [byAccessRoleResult.data, byMainRoleResult.data, selectedSupervisor, selectedSupervisorId]);

    return {
        options,
        loading: byMainRoleQuery.isLoading || byAccessRoleQuery.isLoading
    };
};
