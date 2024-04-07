import type { FilterDropdownProps, TablePaginationConfig } from '@pankod/refine-antd';
import {
    DateField,
    DatePicker,
    DeleteButton,
    EditButton,
    FilterDropdown,
    Form,
    Icons,
    List,
    NumberField,
    Radio,
    Select,
    Space,
    Table,
    TextField,
    useSelect
} from '@pankod/refine-antd';
import { useList } from '@pankod/refine-core';
import type { IResourceComponentsProps } from '@pankod/refine-core';
// import { Loader } from '@feed/ui/src/loader';
import { ListBooleanNegative, ListBooleanPositive } from '@feed/ui/src/icons'; // TODO exclude src
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { DownloadOutlined } from '@ant-design/icons';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DepartmentEntity,
    FeedTypeEntity,
    KitchenEntity,
    VolEntity
} from '~/interfaces';
import { formDateFormat, saveXLSX } from '~/shared/lib';
import { NEW_API_URL } from '~/const';
import { axios } from '~/authProvider';
import { dataProvider } from '~/dataProvider';

import useCanAccess from './use-can-access';

const booleanFilters = [
    { value: true, text: 'Да' },
    { value: false, text: 'Нет' }
];

const FEED_TYPE_WITHOUT_FEED = 4;

const pagination: TablePaginationConfig = { showTotal: (total) => `Кол-во волонтеров: ${total}` };

export const isVolExpired = (vol: VolEntity, isYesterday: boolean): boolean => {
    const day = isYesterday ? dayjs().subtract(1, 'day') : dayjs();
    return (
        !vol.active_to ||
        !vol.active_from ||
        day < dayjs(vol.active_from).startOf('day').add(7, 'hours') ||
        day > dayjs(vol.active_to).endOf('day').add(7, 'hours')
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

const datePickerFilterDropDown = ({ clearFilters, confirm, selectedKeys, setSelectedKeys }: FilterDropdownProps) => (
    <div style={{ padding: 8 }}>
        <DatePicker
            format={formDateFormat}
            value={selectedKeys[0] as unknown as Dayjs}
            onChange={(value) => setSelectedKeys(value ? [value as unknown as React.Key] : [])}
            style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
            <Button
                type='primary'
                onClick={() => confirm()}
                icon={<Icons.SearchOutlined />}
                size='small'
                style={{ width: 90 }}
            >
                Фильтр
            </Button>
            <Button
                onClick={() => {
                    clearFilters?.();
                    confirm();
                }}
                size='small'
                style={{ width: 90 }}
            >
                Очистить
            </Button>
        </Space>
    </div>
);

export const VolList: FC<IResourceComponentsProps> = () => {
    const [searchText, setSearchText] = useState('');
    const [filterUnfeededType, setfilterUnfeededType] = useState<'' | 'today' | 'yesterday'>('');
    const [feededIsLoading, setFeededIsLoading] = useState(false);
    const [feededIds, setFeededIds] = useState({});

    const canListCustomFields = useCanAccess({ action: 'list', resource: 'volunteer-custom-fields' });

    const { data: volunteers, isLoading: volunteersIsLoading } = useList<VolEntity>({
        resource: 'volunteers',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    const { selectProps: departmentSelectProps } = useSelect<DepartmentEntity>({
        resource: 'departments',
        optionLabel: 'name'
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

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {}
        );
    }, [kitchens]);

    const feedTypeNameById = useMemo(() => {
        return (feedTypes ? feedTypes.data : []).reduce(
            (acc, feedType) => ({
                ...acc,
                [feedType.id]: feedType.name
            }),
            {}
        );
    }, [feedTypes]);

    const colorNameById = useMemo(() => {
        return (colors ? colors.data : []).reduce(
            (acc, color) => ({
                ...acc,
                [color.id]: color.description
            }),
            {}
        );
    }, [colors]);

    const accessRoleById = useMemo(() => {
        return (accessRoles ? accessRoles.data : []).reduce(
            (acc, accessRole) => ({
                ...acc,
                [accessRole.id]: accessRole.name
            }),
            {}
        );
    }, [accessRoles]);

    const filteredData = useMemo(() => {
        return (
            searchText
                ? volunteers?.data.filter((item) => {
                      const searchTextInLowerCase = searchText.toLowerCase();
                      return [
                          item.name,
                          item.first_name,
                          item.last_name,
                          item.departments?.map(({ name }) => name).join(', '),
                          item.active_from ? dayjs(item.active_from).format(formDateFormat) : null
                      ].some((text) => {
                          return text?.toLowerCase().includes(searchTextInLowerCase);
                      });
                  })
                : volunteers?.data
        )?.filter(
            (v) =>
                !filterUnfeededType ||
                (!feededIds[v.id] &&
                    v.is_active &&
                    !v.is_blocked &&
                    !isVolExpired(v, filterUnfeededType === 'yesterday') &&
                    v.feed_type !== FEED_TYPE_WITHOUT_FEED)
        );
    }, [volunteers, searchText, feededIds, filterUnfeededType]);

    // const { selectProps } = useSelect<VolEntity>({
    //     resource: 'volunteers'
    // });

    // return <Loader />;

    const getSorter = (field: string) => {
        return (a, b) => {
            const x = a[field] ?? '';
            const y = b[field] ?? '';

            if (x < y) {
                return -1;
            }
            if (x > y) {
                return 1;
            }
            return 0;
        };
    };

    const onDepartmentFilter = (value, data) => {
        return data.departments.some((d) => d.id === value);
    };

    const onActiveFilter = (value, data) => {
        return data.is_active === value;
    };

    const onBlockedFilter = (value, data) => {
        return data.is_blocked === value;
    };

    const craeteDateFilter = (fieldName) => (filterValue, data) => {
        return dayjs(data[fieldName]).startOf('day').unix() === filterValue.startOf('day').unix();
    };

    const createAndSaveXLSX = useCallback(() => {
        if (filteredData) {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Volunteers');

            const header = [
                'ID',
                'Позывной',
                'Имя',
                'Фамилия',
                'Службы',
                'Роль',
                'От',
                'До',
                'Активирован',
                'Заблокирован',
                'Кухня',
                'Партия бейджа',
                'Тип питания',
                'Веган/мясоед',
                'Комментарий',
                'Цвет бейджа',
                ...customFields?.map((field) => field.name)
            ];
            sheet.addRow(header);

            filteredData.forEach((vol, index) => {
                sheet.addRow([
                    vol.id,
                    vol.name,
                    vol.first_name,
                    vol.last_name,
                    vol.departments ? vol.departments.map((department) => department.name).join(', ') : '',
                    vol.role,
                    vol.active_from ? dayjs(vol.active_from).format(formDateFormat) : '',
                    vol.active_to ? dayjs(vol.active_to).format(formDateFormat) : '',
                    vol.is_active ? 1 : 0,
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
    }, [feedTypeNameById, filteredData, kitchenNameById]);

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

    return (
        <List>
            <Input placeholder='Поиск...' value={searchText} onChange={(e) => setSearchText(e.target.value)}></Input>
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
                            accessRolesIsLoading
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
            </Form>
            <Table
                scroll={{ x: '100%' }}
                pagination={pagination}
                loading={volunteersIsLoading || feededIsLoading}
                dataSource={filteredData}
                rowKey='id'
            >
                <Table.Column<DepartmentEntity>
                    title=''
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
                <Table.Column
                    dataIndex='id'
                    key='id'
                    title='ID'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('id')}
                />
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя на бейдже'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex='first_name'
                    key='first_name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('first_name')}
                />
                <Table.Column
                    dataIndex='last_name'
                    key='last_name'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('last_name')}
                />
                <Table.Column
                    dataIndex='departments'
                    key='departments'
                    title='Службы'
                    render={(value) => <TextField value={value.map(({ name }) => name).join(', ')} />}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Select
                                style={{ minWidth: 300 }}
                                mode='multiple'
                                placeholder='Служба / Локация'
                                {...departmentSelectProps}
                            />
                        </FilterDropdown>
                    )}
                    onFilter={onDepartmentFilter}
                />
                <Table.Column
                    dataIndex='active_from'
                    key='active_from'
                    title='От'
                    render={(value) =>
                        value && <DateField format={formDateFormat} value={value} style={{ whiteSpace: 'nowrap' }} />
                    }
                    sorter={getSorter('active_from')}
                    filterDropdown={datePickerFilterDropDown}
                    onFilter={craeteDateFilter('active_from')}
                />
                <Table.Column
                    dataIndex='active_to'
                    key='active_to'
                    title='До'
                    render={(value) =>
                        value && <DateField format={formDateFormat} value={value} style={{ whiteSpace: 'nowrap' }} />
                    }
                    sorter={getSorter('active_to')}
                    filterDropdown={datePickerFilterDropDown}
                    onFilter={craeteDateFilter('active_to')}
                />
                <Table.Column
                    dataIndex='is_active'
                    key='is_active'
                    title='✅'
                    render={(value) => <ListBooleanPositive value={value} />}
                    sorter={getSorter('is_active')}
                    filters={booleanFilters}
                    onFilter={onActiveFilter}
                />
                <Table.Column
                    dataIndex='is_blocked'
                    key='is_blocked'
                    title='❌'
                    render={(value) => <ListBooleanNegative value={value} />}
                    sorter={getSorter('is_blocked')}
                    filters={booleanFilters}
                    onFilter={onBlockedFilter}
                />
                <Table.Column
                    dataIndex='kitchen'
                    key='kitchen'
                    title='Кухня'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('kitchen')}
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
                    const filterValues = volunteers
                        ? Object.keys(
                              volunteers.data.reduce((acc, vol) => {
                                  const value = getCustomValue(vol, customField);
                                  acc[value] = true;
                                  return acc;
                              }, {})
                          )
                        : [];

                    const filters =
                        customField.type === 'boolean'
                            ? booleanFilters
                            : filterValues.map((value) => ({ value, text: value || '(пустое значение)' }));

                    return (
                        <Table.Column
                            key={customField.name}
                            title={customField.name}
                            filters={filters}
                            onFilter={(value, vol) => {
                                const currentValue = getCustomValue(vol, customField);
                                return value === currentValue;
                            }}
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
