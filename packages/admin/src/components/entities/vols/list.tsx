import type { TablePaginationConfig } from '@pankod/refine-antd';
import { Col, List, Row, Select } from '@pankod/refine-antd';
import { useList } from '@pankod/refine-core';
import type { GetListResponse, IResourceComponentsProps } from '@pankod/refine-core';
import { useEffect, useMemo, useState } from 'react';
import { Input } from 'antd';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
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
    VolEntity,
    VolunteerRoleEntity
} from '~/interfaces';
import { dataProvider } from '~/dataProvider';
import { useMedia } from '~/shared/providers';
import { getSorter } from '~/utils';

import { Filters } from '~/components/entities/vols/vol-list/filters';
import { SaveAsXlsxButton } from '~/components/entities/vols/vol-list/save-as-xlsx-button';
import { VolunteerDesktopTable } from '~/components/entities/vols/vol-list/volunteer-desktop-table';
import { VolunteerMobileList } from '~/components/entities/vols/vol-list/volunteer-mobile-list';
import useCanAccess from './use-can-access';
import useVisibleDirections from './use-visible-directions';
import { FilterField, FilterItem } from '~/components/entities/vols/vol-list/filter-types';
import { ChooseColumnsButton } from '~/components/entities/vols/vol-list/choose-columns-button';
import {
    ActiveColumnsContext,
    ActiveColumnsContextProvider
} from '~/components/entities/vols/vol-list/active-columns-context';

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
        } catch (e) {}
    }
    return [];
};

const getDefaultActiveFilters = (): Array<FilterItem> => {
    const volFilterStr = localStorage.getItem('volFilter');
    if (volFilterStr) {
        try {
            return JSON.parse(volFilterStr) as Array<FilterItem>;
        } catch (e) {}
    }
    return [];
};

export const VolList: FC<IResourceComponentsProps> = () => {
    const getDefaultSearchText = (): string => {
        return localStorage.getItem('volSearchText') || '';
    };

    const [searchText, setSearchText] = useState(getDefaultSearchText);

    useEffect(() => {
        localStorage.setItem('volSearchText', searchText);
    }, [searchText]);

    const { isDesktop, isMobile } = useMedia();

    const router = useRouter();

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

    const canListCustomFields = useCanAccess({ action: 'list', resource: 'volunteer-custom-fields' });

    const visibleDirections = useVisibleDirections();

    const [page, setPage] = useState(parseFloat(localStorage.getItem('volPageIndex') || '') || 1);
    const [pageSize, setPageSize] = useState(parseFloat(localStorage.getItem('volPageSize') || '') || 10);

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

    const { data: volunteers, isLoading: volunteersIsLoading } = useList<VolEntity>({
        resource: `volunteers/${filterQueryParams}`,
        config: {
            pagination: {
                current: isMobile ? 1 : page,
                pageSize: isMobile ? 10000 : pageSize
            }
        }
    });

    const pagination: TablePaginationConfig = {
        total: volunteers?.total ?? 1,
        showTotal: (total) => `Кол-во волонтеров: ${total}`,
        current: page,
        pageSize: pageSize,
        onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
            localStorage.setItem('volPageIndex', page.toString());
            localStorage.setItem('volPageSize', pageSize.toString());
        }
    };

    const { data: directions } = useList<DirectionEntity>({
        resource: 'directions'
    });

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
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    const { data: transports } = useList<TransportEntity>({
        resource: 'transports'
    });

    const { data: statuses } = useList<StatusEntity>({
        resource: 'statuses'
    });

    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges'
    });

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const loadCustomFields = async () => {
        const { data } = await dataProvider.getList<CustomFieldEntity>({
            resource: 'volunteer-custom-fields'
        });

        setCustomFields(data);
    };

    useEffect(() => {
        void loadCustomFields();
    }, []);

    const kitchenNameById = useMapFromList(kitchens);
    const feedTypeNameById = useMapFromList(feedTypes);
    const colorNameById = useMapFromList(colors);
    const accessRoleById = useMapFromList(accessRoles);
    const volunteerRoleById = useMapFromList(volunteerRoles);
    const statusById = useMapFromList(statuses);
    const transportById = useMapFromList(transports);

    const filterFields: Array<FilterField> = [
        {
            type: 'lookup',
            name: 'directions',
            title: 'Службы/Локации',
            getter: (data) => (data.directions || []).map(({ id }) => id),
            skipNull: true,
            lookup: () =>
                (directions?.data ?? [])
                    .slice()
                    .sort(getSorter('name'))
                    .filter(({ id }) => !visibleDirections || visibleDirections.includes(id))
        }, // directions
        // { type: 'string', name: 'id', title: 'ID' },
        { type: 'date', name: 'arrivals.staying_date', title: 'На поле' },
        { type: 'lookup', name: 'arrivals.status', title: 'Статус заезда', lookup: () => statuses?.data ?? [] },
        { type: 'date', name: 'arrivals.arrival_date', title: 'Дата заезда' },
        {
            type: 'lookup',
            name: 'arrivals.arrival_transport',
            title: 'Транспорт заезда',
            lookup: () => transports?.data ?? []
        },
        { type: 'date', name: 'arrivals.departure_date', title: 'Дата отъезда' },
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
            lookup: () => colors?.data.map(({ description: name, id }) => ({ id, name })) ?? []
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

    const volunteersData = volunteers?.data ?? [];

    const queryClient = useQueryClient();

    const openVolunteer = (id: number): Promise<boolean> => {
        queryClient.clear();
        return router.push(`volunteers/edit/${id}`);
    };

    return (
        <List>
            <ActiveColumnsContextProvider customFields={customFields}>
                {/* -------------------------- Фильтры -------------------------- */}
                <Input
                    placeholder='Поиск по волонтерам, датам, службам'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                ></Input>
                <Filters
                    activeFilters={activeFilters}
                    setActiveFilters={setActiveFilters}
                    visibleFilters={visibleFilters}
                    setVisibleFilters={setVisibleFilters}
                    filterFields={filterFields}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    setPage={setPage}
                />
                <Row style={{ padding: '10px 0' }} justify='space-between'>
                    {isDesktop && (
                        <>
                            <Row style={{ gap: '24px' }} align='middle'>
                                <b>Сохраненные таблицы:</b>

                                <Select placeholder='Выберите' disabled></Select>
                            </Row>
                            <Row style={{ gap: '24px' }} align='middle'>
                                <Col>
                                    <b>Результат:</b> {volunteers?.total} волонтеров
                                </Col>
                                <Row style={{ gap: '12px' }} align='middle'>
                                    <ChooseColumnsButton
                                        canListCustomFields={canListCustomFields}
                                        customFields={customFields}
                                    />
                                    <SaveAsXlsxButton
                                        isDisabled={
                                            !volunteersData.length ||
                                            kitchensIsLoading ||
                                            feedTypesIsLoading ||
                                            colorsIsLoading ||
                                            accessRolesIsLoading ||
                                            volunteerRolesIsLoading
                                        }
                                        filterQueryParams={filterQueryParams}
                                        customFields={customFields}
                                        volunteerRoleById={volunteerRoleById}
                                        statusById={statusById}
                                        transportById={transportById}
                                        kitchenNameById={kitchenNameById}
                                        feedTypeNameById={feedTypeNameById}
                                        colorNameById={colorNameById}
                                        accessRoleById={accessRoleById}
                                    />
                                </Row>
                            </Row>
                        </>
                    )}
                </Row>

                {/* -------------------------- Список волонтеров -------------------------- */}
                {isMobile && (
                    <VolunteerMobileList
                        statusById={statusById}
                        volList={volunteersData}
                        openVolunteer={openVolunteer}
                        isLoading={volunteersIsLoading}
                    />
                )}
                {isDesktop && (
                    <VolunteerDesktopTable
                        openVolunteer={openVolunteer}
                        pagination={pagination}
                        statusById={statusById}
                        volunteersIsLoading={volunteersIsLoading}
                        volunteersData={volunteersData}
                        customFields={customFields}
                    />
                )}
            </ActiveColumnsContextProvider>
        </List>
    );
};
