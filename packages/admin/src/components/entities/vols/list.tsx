import type { TablePaginationConfig } from '@pankod/refine-antd';
import {
    Calendar,
    Checkbox,
    DeleteButton,
    EditButton,
    Form,
    Icons,
    List,
    NumberField,
    Popover,
    Radio,
    Space,
    Table,
    Tag,
    TextField,
    useSelect
} from '@pankod/refine-antd';
import { useList } from '@pankod/refine-core';
import type { GetListResponse, IResourceComponentsProps } from '@pankod/refine-core';
import { ListBooleanNegative, ListBooleanPositive } from '@feed/ui/src/icons'; // TODO exclude src
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { DownloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolEntity,
    VolunteerRoleEntity
} from '~/interfaces';
import { formDateFormat, isActivatedStatus, saveXLSX } from '~/shared/lib';
import { NEW_API_URL } from '~/const';
import { axios } from '~/authProvider';
import { dataProvider } from '~/dataProvider';
import type { UserData } from '~/auth';
import { getUserData } from '~/auth';
import { useMedia } from '~/shared/providers';

import styles from './list.module.css';
import useCanAccess from './use-can-access';
import useVisibleDirections from './use-visible-directions';

const booleanFilters = [
    { value: true, text: 'Да' },
    { value: false, text: 'Нет' }
];

const FEED_TYPE_WITHOUT_FEED = 4;

export const isVolExpired = (vol: VolEntity, isYesterday: boolean): boolean => {
    const day = isYesterday ? dayjs().subtract(1, 'day') : dayjs();
    return vol.arrivals.every(
        ({ arrival_date, departure_date, status }) =>
            !isActivatedStatus(status) ||
            day < dayjs(arrival_date).startOf('day').add(7, 'hours') ||
            day > dayjs(departure_date).endOf('day').add(7, 'hours')
    );
};

const getCustomValue = (vol, customField) => {
    const value =
        vol.custom_field_values.find((customFieldValue) => customFieldValue.custom_field === customField.id)?.value ||
        '';
    if (customField.type === 'boolean') {
        return value === 'true';
    }
    return value;
};

const formatDate = (value) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long' });
};

type FilterField = {
    type: string;
    name: string;
    title: string;
    lookup?: () => Array<{ id: unknown; name: string }>;
    getter?: (value: any) => any;
};

type FilterItem = { name: string; op: 'include' | 'exclude'; value: unknown };

type FilterListItem = { selected: boolean; value: unknown; text: string; count: number };

const useMapFromList = (list: GetListResponse | undefined, nameField = 'name') => {
    return useMemo(() => {
        return (list ? list.data : []).reduce(
            (acc, item) => ({
                ...acc,
                [item.id as string]: item[nameField]
            }),
            {}
        );
    }, [list]);
};

export const VolList: FC<IResourceComponentsProps> = () => {
    const [filterUnfeededType, setfilterUnfeededType] = useState<'' | 'today' | 'yesterday'>('');
    const [feededIsLoading, setFeededIsLoading] = useState(false);
    const [feededIds, setFeededIds] = useState({});

    const getDefaultSearchText = () => {
        return localStorage.getItem('volSearchText') || '';
    };

    const [searchText, setSearchText] = useState(getDefaultSearchText);

    useEffect(() => {
        localStorage.setItem('volSearchText', searchText);
    }, [searchText]);

    const { isMobile } = useMedia();
    console.log('isMobile', isMobile);

    const router = useRouter();

    const getDefaultActiveFilters = () => {
        const volFilterStr = localStorage.getItem('volFilter');
        if (volFilterStr) {
            try {
                return JSON.parse(volFilterStr);
            } catch (e) {}
        }
        return [];
    };

    const [activeFilters, setActiveFilters] = useState<Array<FilterItem>>(getDefaultActiveFilters);

    useEffect(() => {
        localStorage.setItem('volFilter', JSON.stringify(activeFilters));
    }, [activeFilters]);

    const getDefaultVisibleFilters = () => {
        const volVisibleFiltersStr = localStorage.getItem('volVisibleFilters');
        if (volVisibleFiltersStr) {
            try {
                return JSON.parse(volVisibleFiltersStr);
            } catch (e) {}
        }
        return [];
    };

    const [visibleFilters, setVisibleFilters] = useState<Array<string>>(getDefaultVisibleFilters);

    useEffect(() => {
        localStorage.setItem('volVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    const canListCustomFields = useCanAccess({ action: 'list', resource: 'volunteer-custom-fields' });
    const canFullList = useCanAccess({ action: 'full_list', resource: 'volunteers' });

    const visibleDirections = useVisibleDirections();

    const pagination: TablePaginationConfig = {
        showTotal: (total) => `Кол-во волонтеров: ${total}`,
        defaultCurrent: parseFloat(localStorage.getItem('volPageIndex') || '') || 1,
        defaultPageSize: parseFloat(localStorage.getItem('volPageSize') || '') || 10,
        onChange: (page, pageSize) => {
            localStorage.setItem('volPageIndex', page.toString());
            localStorage.setItem('volPageSize', pageSize.toString());
        }
    };

    const { data: volunteers, isLoading: volunteersIsLoading } = useList<VolEntity>({
        resource: 'volunteers',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

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

    const { data: transports, isLoading: transportsIsLoading } = useList<TransportEntity>({
        resource: 'transports'
    });

    const { data: statuses, isLoading: statusesIsLoading } = useList<StatusEntity>({
        resource: 'statuses'
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
            lookup: () => directions?.data ?? []
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
        { type: 'string', name: 'name', title: 'Имя на бейдже' },
        { type: 'string', name: 'first_name', title: 'Имя' },
        { type: 'string', name: 'last_name', title: 'Фамилия' },
        { type: 'lookup', name: 'main_role', title: 'Роль', lookup: () => volunteerRoles?.data ?? [] },
        { type: 'boolean', name: 'is_blocked', title: 'Заблокирован' },
        { type: 'lookup', name: 'kitchen', title: 'Кухня', lookup: () => kitchens?.data ?? [] }, // kitchenNameById
        { type: 'number', name: 'printing_batch', title: 'Партия бейджа' },
        { type: 'lookup', name: 'feed_type', title: 'Тип питания', lookup: () => feedTypes?.data ?? [] }, // feedTypeNameById
        { type: 'boolean', name: 'is_vegan', title: 'Веган' },
        { type: 'string', name: 'comment', title: 'Комментарий' },
        {
            type: 'lookup',
            name: 'color_type',
            title: 'Цвет бейджа',
            lookup: () => colors?.data.map(({ description: name, id }) => ({ id, name })) ?? []
        }, // colorNameById
        { type: 'lookup', name: 'access_role', title: 'Право доступа', lookup: () => accessRoles?.data ?? [] } // accessRoleById
    ].concat(
        customFields.map((customField) => ({
            type: customField.type === 'boolean' ? 'boolean' : 'custom',
            name: `custom_field_values.${customField.id}`,
            title: customField.name
        }))
    );

    const filteredData = useMemo(() => {
        const data = volunteers?.data ?? [];
        return (
            searchText
                ? data.filter((item) => {
                      const searchTextInLowerCase = searchText.toLowerCase();
                      return [
                          item.name,
                          item.first_name,
                          item.last_name,
                          item.directions?.map(({ name }) => name).join(', '),
                          ...item.arrivals.map(({ arrival_date }) => formatDate(arrival_date))
                      ].some((text) => {
                          return text?.toLowerCase().includes(searchTextInLowerCase);
                      });
                  })
                : data
        )
            .filter((v) => !visibleDirections || v.directions?.some(({ id }) => visibleDirections.includes(id)))
            .filter(
                (v) =>
                    !filterUnfeededType ||
                    (!feededIds[v.id] &&
                        !v.is_blocked &&
                        !isVolExpired(v, filterUnfeededType === 'yesterday') &&
                        v.feed_type !== FEED_TYPE_WITHOUT_FEED)
            )
            .filter((vol) => {
                const activeVisibleFilters = activeFilters.filter((filter) => visibleFilters.includes(filter.name));
                const arrivalFilters = activeVisibleFilters.filter((filter) => filter.name.startsWith('arrivals.'));
                if (arrivalFilters.length) {
                    const arrivals = arrivalFilters.reduce((arrivals, filter) => {
                        const key = filter.name.split('.')[1];
                        return arrivals.filter((arrival) => {
                            if (key === 'staying_date') {
                                const filterValue = filter.value as string;
                                return (
                                    filterValue >= arrival.arrival_date &&
                                    filterValue <= arrival.departure_date &&
                                    (activeFilters.some(({ name }) => name === 'arrivals.status') ||
                                        isActivatedStatus(arrival.status))
                                );
                            }
                            const filterValue = filter.value;
                            if (Array.isArray(filterValue)) {
                                return filterValue.some((value) => value === arrival[key]);
                            } else {
                                return filter.value === arrival[key];
                            }
                        });
                    }, vol.arrivals);

                    if (arrivals.length === 0) {
                        return false;
                    }
                }
                return activeVisibleFilters
                    .filter((filter) => !filter.name.startsWith('arrivals.'))
                    .every((filter) => {
                        const path = filter.name.split('.');
                        const fieldValue = vol[path[0]];

                        let value = fieldValue;
                        if (filter.name === 'directions') {
                            value = fieldValue?.map(({ id }) => id);
                        }
                        if (path[0] === 'custom_field_values') {
                            const type = customFields.find(({ id }) => id.toString() === path[1])?.type;

                            value =
                                fieldValue.find(({ custom_field }) => custom_field.toString() === path[1])?.value ||
                                undefined;

                            if (type === 'boolean') {
                                value = value === 'true';
                            }
                        }

                        if (Array.isArray(filter.value)) {
                            if (Array.isArray(value)) {
                                return (
                                    filter.value.some((currentValue) => value.includes(currentValue)) ||
                                    (filter.value.includes(null) && value.length === 0)
                                );
                            } else {
                                return filter.value.some((currentValue) =>
                                    !currentValue ? !currentValue === !value : currentValue == value
                                );
                            }
                        } else if (typeof filter.value === 'string' && typeof value === 'string') {
                            return value.includes(filter.value);
                        } else if (!filter.value) {
                            return !filter.value === !value;
                        } else {
                            return filter.value == value;
                        }
                    });
            });
    }, [
        volunteers,
        searchText,
        feededIds,
        filterUnfeededType,
        canFullList,
        visibleDirections,
        activeFilters,
        visibleFilters
    ]);

    // const { selectProps } = useSelect<VolEntity>({
    //     resource: 'volunteers'
    // });

    // return <Loader />;

    const createAndSaveXLSX = () => {
        if (filteredData) {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Volunteers');

            const header = [
                'ID',
                'Позывной',
                'Имя',
                'Фамилия',
                'Службы/Локации',
                'Роль',
                'Статус текущего завезда',
                'Дата текущего заезда',
                'Транспорт текущего заезда',
                'Дата текущего отъезда',
                'Транспорт текущего отъезда',
                'Статус будущего завезда',
                'Дата будущего заезда',
                'Транспорт будущего заезда',
                'Дата будущего отъезда',
                'Транспорт будущего отъезда',
                'Заблокирован',
                'Кухня',
                'Партия бейджа',
                'Тип питания',
                'Веган/мясоед',
                'Комментарий',
                'Цвет бейджа',
                'Право доступа',
                ...customFields?.map((field) => field.name)
            ];
            sheet.addRow(header);

            filteredData.forEach((vol, index) => {
                const currentArrival = vol.arrivals.find(
                    ({ arrival_date, departure_date }) =>
                        dayjs(arrival_date) < dayjs() && dayjs(departure_date) > dayjs().subtract(1, 'day')
                );
                const futureArrival = vol.arrivals.find(({ arrival_date }) => dayjs(arrival_date) > dayjs());
                sheet.addRow([
                    vol.id,
                    vol.name,
                    vol.first_name,
                    vol.last_name,
                    vol.directions ? vol.directions.map((direction) => direction.name).join(', ') : '',
                    vol.main_role ? volunteerRoleById[vol.main_role] : '',
                    currentArrival ? statusById[currentArrival?.status] : '',
                    currentArrival ? dayjs(currentArrival.arrival_date).format(formDateFormat) : '',
                    currentArrival ? transportById[currentArrival?.arrival_transport] : '',
                    currentArrival ? dayjs(currentArrival.departure_date).format(formDateFormat) : '',
                    currentArrival ? transportById[currentArrival?.departure_transport] : '',
                    futureArrival ? statusById[futureArrival?.status] : '',
                    futureArrival ? dayjs(futureArrival.arrival_date).format(formDateFormat) : '',
                    futureArrival ? transportById[futureArrival?.arrival_transport] : '',
                    futureArrival ? dayjs(futureArrival.departure_date).format(formDateFormat) : '',
                    futureArrival ? transportById[futureArrival?.departure_transport] : '',
                    vol.is_blocked ? 1 : 0,
                    vol.kitchen ? kitchenNameById[vol.kitchen] : '',
                    vol.printing_batch,
                    vol.feed_type ? feedTypeNameById[vol.feed_type] : '',
                    vol.is_vegan ? 'веган' : 'мясоед',
                    vol.comment ? vol.comment.replace(/<[^>]*>/g, '') : '',
                    vol.color_type ? colorNameById[vol.color_type] : '',
                    vol.access_role ? accessRoleById[vol.access_role] : '',
                    ...customFields?.map((field) => {
                        const value =
                            vol.custom_field_values.find((fieldValue) => fieldValue.custom_field === field.id)?.value ||
                            '';
                        if (field.type === 'boolean') {
                            return value === 'true' ? 1 : 0;
                        }
                        return value;
                    })
                ]);
            });
            void saveXLSX(workbook, 'volunteers');
        }
    };

    const handleClickDownload = useCallback((): void => {
        void createAndSaveXLSX();
    }, [createAndSaveXLSX]);

    const handleClickCustomFields = useCallback((): void => {
        window.location.href = `${window.location.origin}/volunteer-custom-fields`;
    }, []);

    const loadTransactions = async () => {
        const newFeededIds = {};
        if (filterUnfeededType) {
            const today = dayjs().startOf('day');
            const from = filterUnfeededType === 'yesterday' ? today.subtract(1, 'day') : today;
            const url = `${NEW_API_URL}/feed-transaction/?limit=100000&dtime_from=${from.toISOString()}&dtime_to=${from
                .add(1, 'day')
                .toISOString()}`;

            try {
                setFeededIsLoading(true);
                const {
                    data: { results }
                } = await axios.get(url);
                results.forEach(({ volunteer }) => {
                    newFeededIds[volunteer] = true;
                });
            } finally {
                setFeededIsLoading(false);
            }
        }
        setFeededIds(newFeededIds);
    };

    useEffect(() => {
        void loadTransactions();
    }, [filterUnfeededType]);

    const getOnField = (vol: VolEntity) => {
        const day = dayjs();
        return vol.arrivals.some(
            ({ arrival_date, departure_date, status }) =>
                isActivatedStatus(status) &&
                day >= dayjs(arrival_date).startOf('day').add(7, 'hours') &&
                day <= dayjs(departure_date).endOf('day').add(7, 'hours')
        );
    };
    const getFilterValueText = (field: FilterField, value: unknown): string => {
        if (value === true) {
            return 'Да';
        }
        if (value === false) {
            return 'Нет';
        }
        if (field.lookup) {
            return field.lookup().find(({ id }) => id === value)?.name ?? '(Пусто)';
        }
        if (value === '') {
            return '(Пусто)';
        }
        return String(value);
    };

    const getFilterListItems = (field: FilterField, filterItem?: FilterItem): Array<FilterListItem> => {
        const filterValue = filterItem?.value;
        const filterValues = Array.isArray(filterValue) ? filterValue : [];

        const lookupItems = field.lookup?.();

        if (lookupItems) {
            return [{ id: null, name: '(Пусто)' }, ...lookupItems].map((item) => ({
                value: item.id,
                text: item.name,
                selected: filterValues.includes(item.id),
                count: 0
            }));
        }

        if (field.type === 'boolean') {
            return [true, false].map((value) => ({
                value,
                text: getFilterValueText(field, value),
                selected: filterValues.includes(value),
                count: 0
            }));
        } else {
            const valueCounts = (volunteers?.data ?? []).reduce((acc: { [key: string]: number }, vol) => {
                const path = field.name.split('.');
                let value = vol[path[0]] || '';
                if (path[0] === 'custom_field_values') {
                    value = value.find(({ custom_field }) => custom_field.toString() === path[1])?.value || '';
                }
                acc[value] = (acc[value] ?? 0) + 1;
                return acc;
            }, {});
            const values = Object.keys(valueCounts).sort();

            return values.map((value) => ({
                value,
                text: getFilterValueText(field, value),
                selected: filterValues.includes(value),
                count: valueCounts[value] ?? 0
            }));
        }
    };

    const onFilterValueChange = (field: FilterField, filterListItem: FilterListItem) => {
        const filterItem = activeFilters.find((f) => f.name === field.name);

        if (filterListItem.selected) {
            if (filterItem && Array.isArray(filterItem.value)) {
                const newValues = filterItem.value.filter((value) => value !== filterListItem.value);
                const newFilters = activeFilters
                    .filter((f) => f.name !== field.name)
                    .concat(
                        newValues.length
                            ? [
                                  {
                                      ...filterItem,
                                      value: newValues
                                  }
                              ]
                            : []
                    );

                setActiveFilters(newFilters);
            }
        } else {
            if (filterItem && Array.isArray(filterItem.value)) {
                const newValues = [...filterItem.value, filterListItem.value];
                const newFilters = activeFilters
                    .filter((f) => f.name !== field.name)
                    .concat([
                        {
                            ...filterItem,
                            value: newValues
                        }
                    ]);

                setActiveFilters(newFilters);
            } else {
                const newFilters = activeFilters.concat([
                    {
                        name: field.name,
                        op: 'include',
                        value: [filterListItem.value]
                    }
                ]);

                setActiveFilters(newFilters);
            }
        }
    };

    const onFilterTextValueChange = (field: FilterField, value: unknown) => {
        const filterItem = activeFilters.find((f) => f.name === field.name);

        if (!value) {
            const newFilters = activeFilters.filter((f) => f.name !== field.name);
            setActiveFilters(newFilters);
        } else if (filterItem) {
            const newFilters = activeFilters
                .filter((f) => f.name !== field.name)
                .concat([
                    {
                        ...filterItem,
                        value
                    }
                ]);

            setActiveFilters(newFilters);
        } else {
            const newFilters = activeFilters.concat([
                {
                    name: field.name,
                    op: 'include',
                    value
                }
            ]);

            setActiveFilters(newFilters);
        }
    };

    const createRenderFilterPopupContent = (field: FilterField) => {
        // const operations = [
        //     {
        //       label: 'включает',
        //       key: 'include',
        //     },
        //     {
        //       label: 'не включает',
        //       key: 'exclude',
        //     }
        //   ];

        const filterItem = activeFilters.find((f) => f.name === field.name);
        // const currentOperation = filterItem?.op === 'exclude' ?  operations[1] : operations[0];
        const filterListItems = getFilterListItems(field, filterItem);

        return function filterPopupContent() {
            return (
                <div style={{ textAlign: 'center' }}>
                    {/* <div className={styles.filterPopupHeader}>
                    <span className={styles.filterPopupFieldName}>
                        {field.title}
                    </span>&nbsp;
                    <Dropdown menu={{ items: operations }}>
                        <a><span>{currentOperation.label}&nbsp;<Icons.DownOutlined /></span></a>
                    </Dropdown>
                </div> */}
                    {(field.type === 'string' || field.type === 'custom') && (
                        <Input
                            value={filterItem?.value as string}
                            onChange={(e) => onFilterTextValueChange(field, e.target.value)}
                            placeholder='Введите текст'
                            allowClear
                        />
                    )}
                    {field.type === 'date' && (
                        <Calendar
                            mode='month'
                            style={{ width: 300 }}
                            value={filterItem ? dayjs(filterItem.value as string) : undefined}
                            fullscreen={false}
                            onSelect={(value) => onFilterTextValueChange(field, value.format('YYYY-MM-DD'))}
                        />
                    )}
                    {field.type !== 'string' && field.type !== 'date' && (
                        <div className={styles.filterPopupList}>
                            {filterListItems.map((filterListItem) => {
                                return (
                                    <div
                                        className={styles.filterPopupListItem}
                                        key={filterListItem.text}
                                        onClick={() => onFilterValueChange(field, filterListItem)}
                                    >
                                        <Checkbox
                                            checked={filterListItem.selected}
                                            onChange={() => onFilterValueChange(field, filterListItem)}
                                        />
                                        {filterListItem.text}
                                        {filterListItem.count > 0 && (
                                            <span className={styles.filterListItemCount}>({filterListItem.count})</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {filterItem && (
                        <Button
                            type='link'
                            onClick={() => onFilterTextValueChange(field, null)}
                            style={{ marginTop: 10 }}
                        >
                            Сбросить
                        </Button>
                    )}
                </div>
            );
        };
    };

    const renderFilterItemText = (field: FilterField) => {
        const filterItem = activeFilters.find((f) => f.name == field.name);

        if (filterItem) {
            return (
                <span className={styles.filterItemActive}>
                    <span className={styles.filterItemNameActive}>{field.title}:</span>
                    &nbsp;
                    <span>
                        {(Array.isArray(filterItem.value) ? filterItem.value : [filterItem.value])
                            .map((value) => getFilterValueText(field, value))
                            .join(', ')}
                    </span>
                </span>
            );
        }
        return <span>{field.title}</span>;
    };

    const toggleVisibleFilter = (name: string) => {
        const visible = visibleFilters.includes(name);
        if (visible) {
            setVisibleFilters(visibleFilters.filter((currentName) => currentName !== name));
        } else {
            setVisibleFilters([...visibleFilters, name]);
        }
    };

    const renderFilterChooser = () => {
        return (
            <div className={styles.filterPopupList}>
                {filterFields.map((filterField) => {
                    return (
                        <div
                            className={styles.filterPopupListItem}
                            key={filterField.title}
                            onClick={() => toggleVisibleFilter(filterField.name)}
                        >
                            <Checkbox
                                checked={visibleFilters.includes(filterField.name)}
                                onChange={() => toggleVisibleFilter(filterField.name)}
                            />
                            {filterField.title}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMobileList = () => (
        <div className={styles.mobileVolList}>
            {filteredData.map((vol) => {
                const arrivals = vol.arrivals
                    .map(({ arrival_date, departure_date }) =>
                        [arrival_date, departure_date].map(formatDate).join(' - ')
                    )
                    .join(', ');
                const name = `${vol.name} ${vol.first_name} ${vol.last_name}`;
                const comment = vol?.direction_head_comment;
                const isBlocked = vol.is_blocked;
                const isOnField = getOnField(vol);

                return (
                    <div
                        className={styles.volCard}
                        key={vol.id}
                        onClick={() => {
                            void router.push(`volunteers/edit/${vol.id}`);
                        }}
                    >
                        <div className={styles.name}>{name}</div>
                        <div>{arrivals || 'Нет данных о датах'}</div>
                        <div>
                            {isBlocked && <Tag color='red'>Заблокирован</Tag>}
                            {isOnField && <Tag>На поле</Tag>}
                            {!isBlocked && !isOnField && 'Нет данных о статусе'}
                        </div>
                        <div>
                            <span className={styles.commentary}>Комментарий: </span>
                            {comment || '-'}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <List>
            <Input
                placeholder='Поиск...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
            ></Input>
            <div className={styles.filters}>
                <div className={styles.filtersLabel}>Фильтры:</div>
                <div className={styles.filterItems}>
                    {filterFields
                        .filter((field) => visibleFilters.includes(field.name))
                        .map((field) => {
                            return (
                                <Popover
                                    key={field.name}
                                    placement='bottomLeft'
                                    content={createRenderFilterPopupContent(field)}
                                    overlayInnerStyle={{ borderRadius: 0 }}
                                    trigger='click'
                                >
                                    <Button className={styles.filterItemButton}>
                                        {renderFilterItemText(field)}
                                        <span className={styles.filterDownIcon}>
                                            <Icons.DownOutlined />
                                        </span>
                                    </Button>
                                </Popover>
                            );
                        })}
                    <Popover
                        key='add-filter'
                        placement='bottomLeft'
                        content={renderFilterChooser}
                        overlayInnerStyle={{ borderRadius: 0 }}
                        trigger='click'
                    >
                        <Button type='link' icon={<Icons.PlusOutlined />}>
                            Фильтр
                        </Button>
                    </Popover>
                </div>
            </div>
            <Form layout='inline' style={{ padding: '10px 0' }}>
                <Form.Item>
                    <Button
                        type={'primary'}
                        onClick={handleClickDownload}
                        icon={<DownloadOutlined />}
                        disabled={
                            !filteredData &&
                            kitchensIsLoading &&
                            feedTypesIsLoading &&
                            colorsIsLoading &&
                            accessRolesIsLoading &&
                            volunteerRolesIsLoading
                        }
                    >
                        Выгрузить
                    </Button>
                </Form.Item>
                <Form.Item>
                    <Radio.Group value={filterUnfeededType} onChange={(e) => setfilterUnfeededType(e.target.value)}>
                        <Radio.Button value=''>Все</Radio.Button>
                        <Radio.Button value='today'>Не питавшиеся сегодня</Radio.Button>
                        <Radio.Button value='yesterday'>Не питавшиеся вчера</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item>
                    <Button disabled={!canListCustomFields} onClick={handleClickCustomFields}>
                        Кастомные поля
                    </Button>
                </Form.Item>
                <Form.Item>Кол-во волонтеров: {filteredData.length}</Form.Item>
            </Form>
            <Table
                scroll={{ x: '100%' }}
                pagination={pagination}
                loading={volunteersIsLoading || feededIsLoading}
                dataSource={filteredData}
                rowKey='id'
            >
                <Table.Column<VolEntity>
                    title=''
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
                <Table.Column dataIndex='id' key='id' title='ID' render={(value) => <TextField value={value} />} />
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя на бейдже'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='first_name'
                    key='first_name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='last_name'
                    key='last_name'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='directions'
                    key='directions'
                    title='Службы / Локации'
                    render={(value) => <TextField value={value.map(({ name }) => name).join(', ')} />}
                />
                <Table.Column
                    dataIndex='arrivals'
                    key='arrivals'
                    title='Даты на поле'
                    render={(arrivals) => (
                        <span style={{ whiteSpace: 'nowrap' }}>
                            {arrivals
                                .map(({ arrival_date, departure_date }) =>
                                    [arrival_date, departure_date].map(formatDate).join(' - ')
                                )
                                .join(', ')}
                        </span>
                    )}
                />
                <Table.Column
                    key='on_field'
                    title='На поле'
                    render={(vol) => {
                        const value = getOnField(vol as VolEntity);
                        return <ListBooleanPositive value={value} />;
                    }}
                />
                <Table.Column
                    dataIndex='is_blocked'
                    key='is_blocked'
                    title='❌'
                    render={(value) => <ListBooleanNegative value={value} />}
                />
                <Table.Column
                    dataIndex='kitchen'
                    key='kitchen'
                    title='Кухня'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='printing_batch'
                    key='printing_batch'
                    title={
                        <span>
                            Партия
                            <br />
                            Бейджа
                        </span>
                    }
                    render={(value) => value && <NumberField value={value} />}
                />

                <Table.Column
                    dataIndex='comment'
                    key='comment'
                    title='Комментарий'
                    render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                />

                {customFields?.map((customField) => {
                    return (
                        <Table.Column
                            key={customField.name}
                            title={customField.name}
                            render={(vol) => {
                                const value = getCustomValue(vol, customField);
                                if (customField.type === 'boolean') {
                                    return <ListBooleanPositive value={value} />;
                                }
                                return value;
                            }}
                        />
                    );
                })}
            </Table>
        </List>
    );
};
