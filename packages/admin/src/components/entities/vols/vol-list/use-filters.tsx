import { useEffect, useMemo, useState } from 'react';
import { GetListResponse, useList } from '@refinedev/core';

import {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolunteerRoleEntity
} from 'interfaces';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';
import { FilterField, FilterItem } from 'components/entities/vols/vol-list/filter-types';
import { getSorter } from 'utils';

const useMapFromList = (list: GetListResponse | undefined, nameField = 'name'): Record<string, string> => {
    return useMemo(() => {
        return (list ? list.data : []).reduce(
            (acc, item) => ({
                ...acc,
                [item.id as string]: item[nameField]
            }),
            {}
        );
    }, [list, nameField]);
};

const getDefaultVisibleFilters = (): Array<string> => {
    const volVisibleFiltersStr = localStorage.getItem('volVisibleFilters');
    if (volVisibleFiltersStr) {
        try {
            return JSON.parse(volVisibleFiltersStr) as Array<string>;
        } catch {
            /* empty */
        }
    }
    return [];
};

const getDefaultActiveFilters = (): Array<FilterItem> => {
    const volFilterStr = localStorage.getItem('volFilter');
    if (volFilterStr) {
        try {
            return JSON.parse(volFilterStr) as Array<FilterItem>;
        } catch {
            /* empty */
        }
    }
    return [];
};

const getDefaultSearchText = (): string => {
    return localStorage.getItem('volSearchText') || '';
};

export const useFilters = ({
    customFields,
    setPage
}: {
    setPage: (value: number) => void;
    customFields: Array<CustomFieldEntity>;
}) => {
    const [searchText, setSearchText] = useState(getDefaultSearchText);

    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges'
    });

    useEffect(() => {
        localStorage.setItem('volSearchText', searchText);
    }, [searchText]);

    const visibleDirections = useVisibleDirections();

    const [activeFilters, setActiveFilters] = useState<Array<FilterItem>>(getDefaultActiveFilters);

    useEffect(() => {
        localStorage.setItem('volFilter', JSON.stringify(activeFilters));
    }, [activeFilters]);

    const [visibleFilters, setVisibleFilters] = useState<Array<string>>(getDefaultVisibleFilters);

    useEffect(() => {
        localStorage.setItem('volVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    useEffect(() => {
        setPage(1);
    }, [activeFilters, visibleFilters, searchText]);

    const { data: directions } = useList<DirectionEntity>({
        resource: 'directions'
    });

    const filterQueryParams = useMemo(() => {
        const formatFilter = (name: string, value: unknown): string => {
            if (name.startsWith('custom_field_values.')) {
                const customFieldId = name.split('.')[1];
                return `custom_field_id=${customFieldId}&custom_field_value=${value}`;
            }
            return `${name}=${value}`;
        };

        const activeVisibleFilters = activeFilters.filter((filter) => visibleFilters.includes(filter.name));

        if (
            visibleDirections &&
            visibleDirections.length &&
            !activeVisibleFilters.some(({ name }) => name === 'directions')
        ) {
            activeVisibleFilters.push({
                name: 'directions',
                op: 'include',
                value: visibleDirections
            });
        }

        const queryParams = activeVisibleFilters.flatMap(({ name, value }) => {
            if (Array.isArray(value)) {
                return value.map((v) => formatFilter(name, v));
            }

            return formatFilter(name, value);
        });

        if (searchText) {
            queryParams.push(`search=${searchText}`);
        }

        return queryParams.length ? `?${queryParams.join('&')}` : '';
    }, [activeFilters, visibleFilters, searchText, visibleDirections]);

    const { data: kitchens, isLoading: kitchensIsLoading } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const { data: feedTypes, isLoading: feedTypesIsLoading } = useList<FeedTypeEntity>({
        resource: 'feed-types'
    });

    const { data: colors, isLoading: colorsIsLoading } = useList<ColorTypeEntity>({
        resource: 'colors'
    });

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    const { data: volunteerRoles, isLoading: volunteerRolesIsLoading } = useList<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        pagination: {
            pageSize: 10000
        }
    });

    const { data: transports } = useList<TransportEntity>({
        resource: 'transports'
    });

    const { data: statuses } = useList<StatusEntity>({
        resource: 'statuses'
    });

    const filterFields: Array<FilterField> = [
        {
            type: 'lookup',
            name: 'directions',
            title: 'Службы/Локации',
            getter: (data: { directions: any }) => (data.directions || []).map(({ id }: { id: string }) => id),
            skipNull: true,
            lookup: () =>
                (directions?.data ?? [])
                    .slice()
                    .sort(getSorter('name'))
                    .filter(({ id }) => !visibleDirections || visibleDirections.includes(id))
        }, // directions
        { type: 'date', name: 'arrivals.staying_date', title: 'На поле' },
        {
            type: 'lookup',
            name: 'arrivals.status',
            title: 'Статус заезда',
            lookup: () => statuses?.data ?? []
        },
        { type: 'date', name: 'arrivals.arrival_date', title: 'Дата заезда' },
        {
            type: 'lookup',
            name: 'arrivals.arrival_transport',
            title: 'Транспорт заезда',
            lookup: () => transports?.data ?? []
        },
        {
            type: 'date',
            name: 'arrivals.departure_date',
            title: 'Дата отъезда'
        },
        {
            type: 'lookup',
            name: 'arrivals.departure_transport',
            title: 'Транспорт отъезда',
            lookup: () => transports?.data ?? []
        },
        { type: 'date', name: 'feeded_date', title: 'Питался' },
        { type: 'date', name: 'non_feeded_date', title: 'Не питался' },
        { type: 'string', name: 'name', title: 'Имя на бейдже' },
        { type: 'string', name: 'first_name', title: 'Имя' },
        { type: 'string', name: 'last_name', title: 'Фамилия' },
        {
            type: 'lookup',
            name: 'main_role',
            title: 'Роль',
            skipNull: true,
            single: true,
            lookup: () => volunteerRoles?.data ?? []
        },
        { type: 'boolean', name: 'is_blocked', title: 'Заблокирован' },
        {
            type: 'lookup',
            name: 'kitchen',
            title: 'Кухня',
            skipNull: true,
            single: true,
            lookup: () => kitchens?.data ?? []
        }, // kitchenNameById
        { type: 'string', name: 'printing_batch', title: 'Партия бейджа' },
        { type: 'string', name: 'badge_number', title: 'Номер бейджа' },
        {
            type: 'lookup',
            name: 'feed_type',
            title: 'Тип питания',
            skipNull: true,
            single: true,
            lookup: () => feedTypes?.data ?? []
        }, // feedTypeNameById
        { type: 'boolean', name: 'is_vegan', title: 'Веган' },
        { type: 'string', name: 'comment', title: 'Комментарий' },
        {
            type: 'lookup',
            name: 'color_type',
            title: 'Цвет бейджа',
            skipNull: true,
            single: true,
            lookup: () =>
                colors?.data.map(({ description: name, id }) => ({
                    id,
                    name
                })) ?? []
        }, // colorNameById
        {
            type: 'lookup',
            name: 'access_role',
            title: 'Право доступа',
            skipNull: true,
            single: true,
            lookup: () => accessRoles?.data ?? []
        }, // accessRoleById
        {
            type: 'lookup',
            name: 'group_badge',
            title: 'Групповой бейдж',
            skipNull: true,
            single: true,
            lookup: () => groupBadges?.data ?? []
        } // groupBadges
    ].concat(
        customFields.map((customField) => ({
            type: customField.type === 'boolean' ? 'boolean' : 'custom',
            name: `custom_field_values.${customField.id}`,
            title: customField.name
        }))
    );

    const kitchenNameById = useMapFromList(kitchens);
    const feedTypeNameById = useMapFromList(feedTypes);
    const colorNameById = useMapFromList(colors);
    const accessRoleById = useMapFromList(accessRoles);
    const volunteerRoleById = useMapFromList(volunteerRoles);
    const statusById = useMapFromList(statuses);
    const transportById = useMapFromList(transports);

    return {
        isFiltersLoading:
            kitchensIsLoading ||
            feedTypesIsLoading ||
            colorsIsLoading ||
            accessRolesIsLoading ||
            volunteerRolesIsLoading,
        filterQueryParams,
        searchText,
        setSearchText,
        setVisibleFilters,
        setActiveFilters,
        filterFields,
        activeFilters,
        visibleFilters,
        kitchenNameById,
        feedTypeNameById,
        colorNameById,
        accessRoleById,
        volunteerRoleById,
        statusById,
        transportById
    };
};
