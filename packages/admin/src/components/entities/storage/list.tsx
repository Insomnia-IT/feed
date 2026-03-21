import { FC } from 'react';
import { DeleteButton, EditButton, List, ShowButton, TextField, useTable } from '@refinedev/antd';
import { Space, Table } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';

import type { StorageEntity } from 'interfaces';

export const StorageList: FC<IResourceComponentsProps> = () => {
    const { tableProps } = useTable<StorageEntity>({ pagination: { pageSize: 10 } });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column<StorageEntity>
                    title="Действия"
                    dataIndex="actions"
                    width={140}
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
                <Table.Column dataIndex="name" title="Название" render={(value) => <TextField value={value} />} />
                <Table.Column
                    dataIndex="description"
                    title="Описание"
                    render={(value) => <TextField value={value || '—'} />}
                />
            </Table>
        </List>
    );
};
