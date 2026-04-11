import React from 'react';
import { List, useTable, EditButton, ShowButton, DeleteButton, getDefaultSortOrder } from '@refinedev/antd';
import { Space, Table } from 'antd';
import type { StorageEntity } from 'interfaces';

export const StorageList: React.FC = () => {
    const { tableProps, sorters } = useTable<StorageEntity>({
        pagination: {
            mode: 'server'
        }
    });

    return (
        <List title="Склады">
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="id"
                    title="ID"
                    sorter={{ multiple: 2 }}
                    defaultSortOrder={getDefaultSortOrder('id', sorters)}
                />
                <Table.Column
                    dataIndex="name"
                    title="Название"
                    sorter={{ multiple: 1 }}
                    defaultSortOrder={getDefaultSortOrder('name', sorters)}
                />
                <Table.Column dataIndex="description" title="Описание" />
                <Table.Column
                    title="Действия"
                    dataIndex="actions"
                    render={(_: any, record: StorageEntity) => (
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
