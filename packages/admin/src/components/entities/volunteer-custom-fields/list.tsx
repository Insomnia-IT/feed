import { FC } from 'react';
import { Table, Space } from 'antd';
import { DeleteButton, EditButton, List, ShowButton, useTable } from '@refinedev/antd';
import type { IResourceComponentsProps } from '@refinedev/core';

import type { VolunteerCustomFieldEntity } from 'interfaces';
import { getSorter } from 'utils';

const mapCrudSortOrderToAntdSortOrder = (order: 'asc' | 'desc' | undefined): 'ascend' | 'descend' | null => {
    if (order === 'asc') return 'ascend';
    if (order === 'desc') return 'descend';
    return null;
};

export const VolunteerCustomFieldList: FC<IResourceComponentsProps> = () => {
    const { tableProps, sorters } = useTable<VolunteerCustomFieldEntity>({
        initialSorter: [{ field: 'id', order: 'asc' }],
        initialPageSize: 1000,
        hasPagination: false
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="name"
                    key="name"
                    title="Название"
                    defaultSortOrder={mapCrudSortOrderToAntdSortOrder(sorters?.find((s) => s.field === 'name')?.order)}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex="type"
                    key="type"
                    title="Тип данных"
                    defaultSortOrder={mapCrudSortOrderToAntdSortOrder(sorters?.find((s) => s.field === 'type')?.order)}
                    sorter={getSorter('type')}
                />
                <Table.Column
                    dataIndex="comment"
                    key="comment"
                    title="Комментарий"
                    render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                />
                <Table.Column
                    dataIndex="mobile"
                    key="mobile"
                    title="Отображать в мобильной админке"
                    sorter={getSorter('mobile')}
                    render={(value) => <p>{value ? 'Да' : 'Нет'}</p>}
                />
                <Table.Column<VolunteerCustomFieldEntity>
                    title="Действия"
                    dataIndex="actions"
                    width="150px"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
