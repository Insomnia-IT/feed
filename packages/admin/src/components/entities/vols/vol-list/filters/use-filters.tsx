import { useCallback, useEffect, useMemo, useState } from 'react';
import { type HttpError, useList } from '@refinedev/core';

import type {
    AccessRoleEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolEntity,
    VolunteerRoleEntity
} from 'interfaces';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';
import {
    type FilterField,
    FilterFieldType,
    type FilterItem
} from 'components/entities/vols/vol-list/filters/filter-types';
import { getSorter } from 'utils';

const SEARCH_TEXT_STORAGE_ITEM_NAME = 'volSearchText';
const FILTERS_STORAGE_ITEM_NAME = 'volFilter';
const VISIBLE_FILTERS_STORAGE_ITEM_NAME = 'volVisibleFilters';

type WithId = { id: number | string };

const safeGetLS = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeSetLS = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* empty */
    }
};

const getFieldString = (obj: object, key: string): string => {
    const value = (obj as Record<string, unknown>)[key];
    return value == null ? '' : String(value);
};

const useMapFromList = <T extends WithId>(items: T[] | undefined, nameField = 'name'): Record<string, string> =>
    useMemo(() => {
        const acc: Record<string, string> = {};
        for (const item of items ?? []) {
            acc[String(item.id)] = getFieldString(item as object, nameField);
        }
        return acc;
    }, [items, nameField]);

const isFilterItem = (value: unknown): value is FilterItem =>
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'op' in value &&
    'value' in value &&
    typeof (value as { name: unknown }).name === 'string';

const getDefaultVisibleFilters = (): Array<string> => {
    const str = safeGetLS(VISIBLE_FILTERS_STORAGE_ITEM_NAME);
    if (str) {
        try {
            const parsed = JSON.parse(str) as unknown;
            return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
        } catch {
            /* empty */
        }
    }
    return [];
};

const getDefaultActiveFilters = (): Array<FilterItem> => {
    const str = safeGetLS(FILTERS_STORAGE_ITEM_NAME);
    if (str) {
        try {
            const parsed = JSON.parse(str) as unknown;
            return Array.isArray(parsed) ? parsed.filter(isFilterItem) : [];
        } catch {
            /* empty */
        }
    }
    return [];
};

const changeStorageAndPageOnlyIfNeeded = ({
    itemName,
    value,
    resetPage
}: {
    itemName: string;
    value: unknown;
    resetPage: () => void;
}) => {
    const currentValue = safeGetLS(itemName);
    const newValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (currentValue !== newValue) {
        resetPage();
        safeSetLS(itemName, newValue);
    }
};

export const useFilters = ({
    customFields,
    customFieldsLoaded,
    setPage
}: {
    setPage: (page: number) => void;
    customFields: CustomFieldEntity[];
    customFieldsLoaded: boolean;
}) => {
    const [searchText, setSearchTextState] = useState(() => safeGetLS(SEARCH_TEXT_STORAGE_ITEM_NAME) || '');

    const resetPage = useCallback(() => {
        setPage(1);
    }, [setPage]);

    const [activeFiltersState, setActiveFiltersState] = useState<Array<FilterItem>>(getDefaultActiveFilters);
    const [visibleFiltersState, setVisibleFiltersState] = useState<Array<string>>(getDefaultVisibleFilters);

    useEffect(() => {
        safeSetLS(SEARCH_TEXT_STORAGE_ITEM_NAME, searchText);
    }, [searchText]);

    const { result: groupBadgesResult } = useList<GroupBadgeEntity, HttpError>({
        resource: 'group-badges',
        pagination: { pageSize: 0 }
    });

    const { result: directionsResult } = useList<DirectionEntity, HttpError>({
        resource: 'directions',
        pagination: { pageSize: 0 }
    });

    const visibleDirections = useVisibleDirections();

    const { result: kitchensResult, query: kitchensQuery } = useList<KitchenEntity, HttpError>({
        resource: 'kitchens',
        pagination: { pageSize: 0 }
    });

    const { result: feedTypesResult, query: feedTypesQuery } = useList<FeedTypeEntity, HttpError>({
        resource: 'feed-types',
        pagination: { pageSize: 0 }
    });

    const { result: accessRolesResult, query: accessRolesQuery } = useList<AccessRoleEntity, HttpError>({
        resource: 'access-roles',
        pagination: { pageSize: 0 }
    });

    const { result: volunteerRolesResult, query: volunteerRolesQuery } = useList<VolunteerRoleEntity, HttpError>({
        resource: 'volunteer-roles',
        pagination: { pageSize: 10000 }
    });

    const { result: transportsResult } = useList<TransportEntity, HttpError>({
        resource: 'transports',
        pagination: { pageSize: 0 }
    });

    const { result: statusesResult } = useList<StatusEntity, HttpError>({
        resource: 'statuses',
        pagination: { pageSize: 0 }
    });

    const { result: supervisorsResult, query: supervisorsQuery } = useList<VolEntity, HttpError>({
        resource: 'volunteers',
        filters: [
            {
                field: 'is_supervisor',
                operator: 'eq',
                value: true
            }
        ],
        pagination: { pageSize: 0 }
    });
    const directionsLookup = useMemo(
        () =>
            (directionsResult.data ?? [])
                .slice()
                .sort(getSorter('name'))
                .filter(({ id }) => !visibleDirections || visibleDirections.includes(String(id))),
        [directionsResult.data, visibleDirections]
    );
    const statusesLookup = useMemo(() => statusesResult.data ?? [], [statusesResult.data]);
    const transportsLookup = useMemo(() => transportsResult.data ?? [], [transportsResult.data]);
    const volunteerRolesLookup = useMemo(() => volunteerRolesResult.data ?? [], [volunteerRolesResult.data]);
    const kitchensLookup = useMemo(() => kitchensResult.data ?? [], [kitchensResult.data]);
    const feedTypesLookup = useMemo(() => feedTypesResult.data ?? [], [feedTypesResult.data]);
    const accessRolesLookup = useMemo(() => accessRolesResult.data ?? [], [accessRolesResult.data]);
    const groupBadgesLookup = useMemo(() => groupBadgesResult.data ?? [], [groupBadgesResult.data]);
    const supervisorsLookup = useMemo(
        () =>
            (supervisorsResult.data ?? []).map((supervisor) => ({
                id: supervisor.id,
                name: supervisor.name ?? ''
            })),
        [supervisorsResult.data]
    );

    const filterFields = useMemo<FilterField[]>(
        () => [
            {
                type: FilterFieldType.Lookup,
                name: 'directions',
                title: 'Службы/Локации',
                getter: (value: unknown) => {
                    const data = value as { directions?: Array<{ id: number | string }> };
                    return (data.directions ?? []).map(({ id }) => String(id));
                },
                skipNull: true,
                lookup: () => directionsLookup
            },
            { type: FilterFieldType.Date, name: 'arrivals.staying_date', title: 'На поле' },
            { type: FilterFieldType.Date, name: 'paid_arrivals.staying_date', title: 'Оплаченные даты' },
            {
                type: FilterFieldType.Boolean,
                single: true,
                name: 'paid_arrivals.is_free',
                title: 'Оплаченные бесплатные'
            },
            {
                type: FilterFieldType.Lookup,
                name: 'arrivals.status',
                title: 'Статус заезда',
                lookup: () => statusesLookup
            },
            { type: FilterFieldType.Date, name: 'arrivals.arrival_date', title: 'Дата заезда' },
            {
                type: FilterFieldType.Lookup,
                name: 'arrivals.arrival_transport',
                title: 'Транспорт заезда',
                lookup: () => transportsLookup
            },
            { type: FilterFieldType.Date, name: 'arrivals.departure_date', title: 'Дата отъезда' },
            {
                type: FilterFieldType.Lookup,
                name: 'arrivals.departure_transport',
                title: 'Транспорт отъезда',
                lookup: () => transportsLookup
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
                lookup: () => volunteerRolesLookup
            },
            { type: FilterFieldType.Boolean, single: true, name: 'is_blocked', title: 'Заблокирован' },
            { type: FilterFieldType.Boolean, name: 'is_deleted', title: 'Удален' },
            {
                type: FilterFieldType.Lookup,
                name: 'kitchen',
                title: 'Кухня',
                skipNull: true,
                single: true,
                lookup: () => kitchensLookup
            },
            { type: FilterFieldType.String, name: 'printing_batch', title: 'Партия бейджа' },
            { type: FilterFieldType.String, name: 'badge_number', title: 'Номер бейджа' },
            {
                type: FilterFieldType.Lookup,
                name: 'feed_type',
                title: 'Тип питания',
                skipNull: true,
                single: true,
                lookup: () => feedTypesLookup
            },
            { type: FilterFieldType.Boolean, single: true, name: 'is_vegan', title: 'Веган' },
            { type: FilterFieldType.Boolean, single: true, name: 'infant', title: '<18 лет' },
            { type: FilterFieldType.Boolean, single: true, name: 'is_ticket_received', title: 'Выдан билет' },
            { type: FilterFieldType.String, name: 'comment', title: 'Комментарий' },
            { type: FilterFieldType.Boolean, single: true, name: 'is_qr_empty', title: 'Пустой QR' },
            {
                type: FilterFieldType.Lookup,
                name: 'access_role',
                title: 'Право доступа',
                skipNull: true,
                single: true,
                lookup: () => accessRolesLookup
            },
            {
                type: FilterFieldType.Lookup,
                name: 'group_badge',
                title: 'Групповой бейдж',
                skipNull: true,
                single: true,
                lookup: () => groupBadgesLookup
            },
            {
                type: FilterFieldType.Lookup,
                name: 'supervisor_id',
                title: 'Бригадир',
                skipNull: true,
                single: true,
                lookup: () => supervisorsLookup
            },
            { type: FilterFieldType.Boolean, single: true, name: 'is_supervisor', title: 'Является бригадиром' },
            { type: FilterFieldType.Boolean, single: true, name: 'has_supervisor', title: 'Назначен бригадир' },
            ...customFields.map<FilterField>((customField) => ({
                type: customField.type === 'boolean' ? FilterFieldType.Boolean : FilterFieldType.Custom,
                name: `custom_field_values.${customField.id}`,
                title: customField.name,
                ...(customField.type === 'boolean' ? { single: true } : {})
            }))
        ],
        [
            accessRolesLookup,
            customFields,
            directionsLookup,
            feedTypesLookup,
            groupBadgesLookup,
            kitchensLookup,
            statusesLookup,
            supervisorsLookup,
            transportsLookup,
            volunteerRolesLookup
        ]
    );

    const validFilterNames = useMemo(() => new Set(filterFields.map(({ name }) => name)), [filterFields]);

    const visibleFilters = useMemo(
        () =>
            customFieldsLoaded ? visibleFiltersState.filter((name) => validFilterNames.has(name)) : visibleFiltersState,
        [customFieldsLoaded, validFilterNames, visibleFiltersState]
    );

    const activeFilters = useMemo(
        () =>
            customFieldsLoaded
                ? activeFiltersState.filter(({ name }) => validFilterNames.has(name))
                : activeFiltersState,
        [activeFiltersState, customFieldsLoaded, validFilterNames]
    );
    const visibleFilterSet = useMemo(() => new Set(visibleFilters), [visibleFilters]);

    useEffect(() => {
        safeSetLS(FILTERS_STORAGE_ITEM_NAME, JSON.stringify(activeFilters));
    }, [activeFilters]);

    useEffect(() => {
        safeSetLS(VISIBLE_FILTERS_STORAGE_ITEM_NAME, JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    useEffect(() => {
        setPage(1);
    }, [activeFilters, visibleFilters, searchText, setPage]);

    const formatFilter = useCallback((name: string, value: unknown) => {
        if (name.startsWith('custom_field_values.')) {
            const customFieldId = name.split('.')[1];
            return `custom_field_id=${customFieldId}&custom_field_value=${value}`;
        }

        return `${name}=${value}`;
    }, []);

    const buildFilterQueryParams = useCallback(
        (enforceVisibleDirections: boolean): string => {
            const activeVisibleFilters = activeFilters.filter(({ name }) => visibleFilterSet.has(name));
            if (
                enforceVisibleDirections &&
                visibleDirections?.length &&
                !activeVisibleFilters.some(({ name }) => name === 'directions')
            ) {
                activeVisibleFilters.push({
                    name: 'directions',
                    op: 'include',
                    value: visibleDirections
                });
            }

            const params = activeVisibleFilters.flatMap(({ name, value }) =>
                Array.isArray(value) ? value.map((v) => formatFilter(name, v)) : formatFilter(name, value)
            );

            if (searchText) {
                params.push(`search=${searchText}`);
            }

            return params.length ? `?${params.join('&')}` : '';
        },
        [activeFilters, visibleFilterSet, searchText, visibleDirections, formatFilter]
    );

    const filterQueryParams = useMemo(() => buildFilterQueryParams(true), [buildFilterQueryParams]);
    const filterQueryParamsWithoutDefaultDirections = useMemo(
        () => buildFilterQueryParams(false),
        [buildFilterQueryParams]
    );

    return {
        isFiltersLoading:
            kitchensQuery.isLoading ||
            feedTypesQuery.isLoading ||
            accessRolesQuery.isLoading ||
            volunteerRolesQuery.isLoading ||
            supervisorsQuery.isLoading,
        filterQueryParams,
        filterQueryParamsWithoutDefaultDirections,
        searchText,
        setSearchText: (value: string) => {
            setSearchTextState(value);
            changeStorageAndPageOnlyIfNeeded({ itemName: SEARCH_TEXT_STORAGE_ITEM_NAME, value, resetPage });
        },
        setVisibleFilters: (value: string[]) => {
            setVisibleFiltersState(value);
            changeStorageAndPageOnlyIfNeeded({ itemName: VISIBLE_FILTERS_STORAGE_ITEM_NAME, value, resetPage });
        },
        setActiveFilters: (value: FilterItem[]) => {
            setActiveFiltersState(value);
            changeStorageAndPageOnlyIfNeeded({ itemName: FILTERS_STORAGE_ITEM_NAME, value, resetPage });
        },
        filterFields,
        activeFilters,
        visibleFilters,
        kitchenNameById: useMapFromList(kitchensResult.data),
        feedTypeNameById: useMapFromList(feedTypesResult.data),
        accessRoleById: useMapFromList(accessRolesResult.data),
        volunteerRoleById: useMapFromList(volunteerRolesResult.data),
        statusById: useMapFromList(statusesResult.data),
        transportById: useMapFromList(transportsResult.data)
    };
};
