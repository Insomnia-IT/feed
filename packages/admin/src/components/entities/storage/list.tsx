import React from 'react';
import { List, useTable, EditButton, DeleteButton, getDefaultSortOrder } from '@refinedev/antd';
import { useNavigate } from 'react-router';
import { Space, Table } from 'antd';
import type { StorageEntity } from 'interfaces';

export const StorageList: React.FC = () => {
    const navigate = useNavigate();
    const { tableProps, sorters } = useTable<StorageEntity>({
        pagination: {
            mode: 'server'
        }
    });

    return (
        <List title="Склады">
            <Table
                {...tableProps}
                rowKey="id"
                onRow={(record: StorageEntity) => ({
                    onClick: () => {
                        navigate(`/storages/show/${record.id}`);
                    },
                    style: { cursor: 'pointer' }
                })}
            >
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
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
