import {
    Checkbox,
    DateField,
    DeleteButton,
    EditButton,
    FilterDropdown,
    List,
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
import { useCallback, useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { DownloadOutlined } from '@ant-design/icons';
import { FeedType } from '@feed/scanner/src/db';

import type { KitchenEntity, VolEntity, DepartmentEntity } from '~/interfaces';
import { formDateFormat, saveXLSX } from '~/shared/lib';

const booleanFilters = [
    { value: true, text: 'Да' },
    { value: false, text: 'Нет' }
];

export const VolList: FC<IResourceComponentsProps> = () => {
    const [searchText, setSearchText] = useState('');

    const { data: volunteers } = useList<VolEntity>({
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

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {}
        );
    }, [kitchens]);

    const filteredData = useMemo(() => {
        return searchText
            ? volunteers?.data.filter((item) => {
                  const searchTextInLowerCase = searchText.toLowerCase();
                  return [
                      item.nickname,
                      item.name,
                      item.lastname,
                      item.departments?.map(({ name }) => name).join(', '),
                      item.active_from ? dayjs(item.active_from).format(formDateFormat) : null
                  ].some((text) => {
                      return text?.toLowerCase().includes(searchTextInLowerCase);
                  });
              })
            : volunteers?.data;
    }, [volunteers, searchText]);

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
                'Кухня',
                'От',
                'До',
                'Активирован',
                'Заблокирован',
                'Тип питания',
                'Веган/мясоед',
                'Комментарий'
            ];
            sheet.addRow(header);

            filteredData.forEach((vol) => {
                sheet.addRow([
                    vol.id,
                    vol.nickname,
                    vol.name,
                    vol.lastname,
                    vol.departments ? vol.departments.map((department) => department.name).join(', ') : '',
                    vol.kitchen ? kitchenNameById[vol.kitchen] : '',
                    vol.active_from ? dayjs(vol.active_from).format(formDateFormat) : '',
                    vol.active_to ? dayjs(vol.active_to).format(formDateFormat) : '',
                    vol.is_active ? 1 : 0,
                    vol.is_blocked ? 1 : 0,
                    vol.feed_type === FeedType.FT1 ? 'фри' : 'платно',
                    vol.is_vegan ? 'веган' : 'мясоед',
                    vol.comment ? vol.comment.replace(/<[^>]*>/g, '') : ''
                ]);
            });
            void saveXLSX(workbook, 'volunteers');
        }
    }, [filteredData, kitchenNameById]);

    const handleClickDownload = useCallback((): void => {
        void createAndSaveXLSX();
    }, [createAndSaveXLSX]);

    return (
        <List>
            <Input value={searchText} onChange={(e) => setSearchText(e.target.value)}></Input>
            <Table
                dataSource={filteredData}
                rowKey='id'
                footer={() => (
                    <Button
                        type={'primary'}
                        onClick={handleClickDownload}
                        icon={<DownloadOutlined />}
                        disabled={!filteredData && kitchensIsLoading}
                    >
                        Выгрузить
                    </Button>
                )}
            >
                <Table.Column
                    dataIndex='nickname'
                    key='nickname'
                    title='Позывной'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('nickname')}
                />
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex='lastname'
                    key='lastname'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('lastname')}
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
                    dataIndex='kitchen'
                    key='kitchen'
                    title='Кухня'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('kitchen')}
                />
                <Table.Column
                    dataIndex='active_from'
                    key='active_from'
                    title='От'
                    render={(value) => value && <DateField format={formDateFormat} value={value} />}
                    sorter={getSorter('active_from')}
                />
                <Table.Column
                    dataIndex='active_to'
                    key='active_to'
                    title='До'
                    render={(value) => value && <DateField format={formDateFormat} value={value} />}
                    sorter={getSorter('active_to')}
                />
                <Table.Column
                    dataIndex='is_active'
                    key='is_active'
                    title='Активирован'
                    render={(value) => <ListBooleanPositive value={value} />}
                    sorter={getSorter('is_active')}
                    filters={booleanFilters}
                    onFilter={onActiveFilter}
                />
                <Table.Column
                    dataIndex='is_blocked'
                    key='is_blocked'
                    title='Заблокирован'
                    render={(value) => <ListBooleanNegative value={value} />}
                    sorter={getSorter('is_blocked')}
                    filters={booleanFilters}
                    onFilter={onBlockedFilter}
                />
                <Table.Column
                    dataIndex='comment'
                    key='comment'
                    title='Комментарий'
                    render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                />
                <Table.Column<DepartmentEntity>
                    title='Действия'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
