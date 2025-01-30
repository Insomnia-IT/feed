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
import { FilterField, FilterFieldType, FilterItem } from 'components/entities/vols/vol-list/filters/filter-types';
import { getSorter } from 'utils';
import { useEffect, useMemo, useState } from 'react';
import { GetListResponse, useList } from '@refinedev/core';

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
        resource: 'group-badges',
        pagination: {
            pageSize: 0
        }
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
        resource: 'directions',
        pagination: {
            pageSize: 0
        }
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
        resource: 'kitchens',
        pagination: {
            pageSize: 0
        }
    });

    const { data: feedTypes, isLoading: feedTypesIsLoading } = useList<FeedTypeEntity>({
        resource: 'feed-types',
        pagination: {
            pageSize: 0
        }
    });

    const { data: colors, isLoading: colorsIsLoading } = useList<ColorTypeEntity>({
        resource: 'colors',
        pagination: {
            pageSize: 0
        }
    });

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles',
        pagination: {
            pageSize: 0
        }
    });

    const { data: volunteerRoles, isLoading: volunteerRolesIsLoading } = useList<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        pagination: {
            pageSize: 10000
        }
    });

    const { data: transports } = useList<TransportEntity>({
        resource: 'transports',
        pagination: {
            pageSize: 0
        }
    });

    const { data: statuses } = useList<StatusEntity>({
        resource: 'statuses',
        pagination: {
            pageSize: 0
        }
    });

    const filterFields: Array<FilterField> = [
        {
            type: FilterFieldType.Lookup,
            name: 'directions',
            title: 'Службы/Локации',
            getter: (value: unknown) => {
                const data = value as { directions: Array<{ id: string }> };
                return (data.directions || []).map(({ id }: { id: string }) => id);
            },
            skipNull: true,
            lookup: () =>
                (directions?.data ?? [])
                    .slice()
                    .sort(getSorter('name'))
                    .filter(({ id }) => !visibleDirections || visibleDirections.includes(id))
        }, // directions
        { type: FilterFieldType.Date, name: 'arrivals.staying_date', title: 'На поле' },
        {
            type: FilterFieldType.Lookup,
            name: 'arrivals.status',
            title: 'Статус заезда',
            lookup: () => statuses?.data ?? []
        },
        { type: FilterFieldType.Date, name: 'arrivals.arrival_date', title: 'Дата заезда' },
        {
            type: FilterFieldType.Lookup,
            name: 'arrivals.arrival_transport',
            title: 'Транспорт заезда',
            lookup: () => transports?.data ?? []
        },
        { type: FilterFieldType.Date, name: 'arrivals.departure_date', title: 'Дата отъезда' },
        {
            type: FilterFieldType.Lookup,
            name: 'arrivals.departure_transport',
            title: 'Транспорт отъезда',
            lookup: () => transports?.data ?? []
        },
        { type: FilterFieldType.Date, name: 'feeded_date', title: 'Питался' },
        { type: FilterFieldType.Date, name: 'non_feeded_date', title: 'Не питался' },
        { type: FilterFieldType.String, name: 'name', title: 'Имя на бейдже' },
        { type: FilterFieldType.String, name: 'first_name', title: 'Имя' },
        { type: FilterFieldType.String, name: 'last_name', title: 'Фамилия' },
        {
            type: FilterFieldType.Lookup,
            name: 'main_role',
            title: 'Роль',
            skipNull: true,
            single: true,
            lookup: () => volunteerRoles?.data ?? []
        },
        { type: FilterFieldType.Boolean, name: 'is_blocked', title: 'Заблокирован' },
        {
            type: FilterFieldType.Lookup,
            name: 'kitchen',
            title: 'Кухня',
            skipNull: true,
            single: true,
            lookup: () => kitchens?.data ?? []
        }, // kitchenNameById
        { type: FilterFieldType.String, name: 'printing_batch', title: 'Партия бейджа' },
        { type: FilterFieldType.String, name: 'badge_number', title: 'Номер бейджа' },
        {
            type: FilterFieldType.Lookup,
            name: 'feed_type',
            title: 'Тип питания',
            skipNull: true,
            single: true,
            lookup: () => feedTypes?.data ?? []
        }, // feedTypeNameById
        { type: FilterFieldType.Boolean, name: 'is_vegan', title: 'Веган' },
        { type: FilterFieldType.String, name: 'comment', title: 'Комментарий' },
        {
            type: FilterFieldType.Lookup,
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
            type: FilterFieldType.Lookup,
            name: 'access_role',
            title: 'Право доступа',
            skipNull: true,
            single: true,
            lookup: () => accessRoles?.data ?? []
        }, // accessRoleById
        {
            type: FilterFieldType.Lookup,
            name: 'group_badge',
            title: 'Групповой бейдж',
            skipNull: true,
            single: true,
            lookup: () => groupBadges?.data ?? []
        } // groupBadges
    ].concat(
        customFields.map((customField) => ({
            type: customField.type === 'boolean' ? FilterFieldType.Boolean : FilterFieldType.Custom,
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
