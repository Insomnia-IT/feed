import { useMemo } from 'react';
import { Table, Space } from 'antd';
import { DeleteButton, EditButton, List, ShowButton, useTable } from '@refinedev/antd';
import type { CrudSort } from '@refinedev/core';

import { RichTextPreview } from 'components/controls/rich-text-preview';
import type { VolunteerCustomFieldEntity } from 'interfaces';
import { getSorter } from 'utils';

const mapCrudSortOrderToAntdSortOrder = (order: 'asc' | 'desc' | undefined): 'ascend' | 'descend' | null => {
    if (order === 'asc') return 'ascend';
    if (order === 'desc') return 'descend';
    return null;
};

export const VolunteerCustomFieldList = () => {
    const { tableProps, sorters } = useTable<VolunteerCustomFieldEntity>({
        sorters: {
            initial: [{ field: 'id', order: 'asc' }]
        },
        pagination: {
            mode: 'off',
            pageSize: 1000
        }
    });

    const sortOrderByField = useMemo(() => {
        const map = new Map<string, CrudSort['order']>();
        (sorters ?? []).forEach((s) => map.set(String(s.field), s.order));
        return map;
    }, [sorters]);

    return (
        <List>
            <Table
                {...tableProps}
                rowKey="id"
                pagination={{
                    total: tableProps.dataSource?.length ?? 0,
                    showTotal: (total) => `Всего: ${total}`
                }}
            >
                <Table.Column
                    dataIndex="name"
                    key="name"
                    title="Название"
                    sorter={getSorter('name')}
                    sortOrder={mapCrudSortOrderToAntdSortOrder(sortOrderByField.get('name'))}
                />
                <Table.Column
                    dataIndex="type"
                    key="type"
                    title="Тип данных"
                    sorter={getSorter('type')}
                    sortOrder={mapCrudSortOrderToAntdSortOrder(sortOrderByField.get('type'))}
                />
                <Table.Column
                    dataIndex="comment"
                    key="comment"
                    title="Комментарий"
                    render={(value?: string) => <RichTextPreview html={value} />}
                />
                <Table.Column
                    dataIndex="mobile"
                    key="mobile"
                    title="Отображать в мобильной админке"
                    sorter={getSorter('mobile')}
                    sortOrder={mapCrudSortOrderToAntdSortOrder(sortOrderByField.get('mobile'))}
                    render={(value?: boolean) => <p>{value ? 'Да' : 'Нет'}</p>}
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
