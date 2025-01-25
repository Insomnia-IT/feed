import { FC, ReactNode } from 'react';
import { List, ShowButton, TextField } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { IResourceComponentsProps } from '@refinedev/core';
import { useList } from '@refinedev/core';

import type { DirectionEntity } from 'interfaces';
import { getSorter } from 'utils';

export const DepartmentList: FC<IResourceComponentsProps> = () => {
    const { data: directions } = useList<DirectionEntity>({ pagination: { pageSize: 0 } });

    return (
        <List>
            <Table rowKey="id" dataSource={directions?.data}>
                <Table.Column
                    dataIndex="name"
                    title="Название"
                    render={(value: string): ReactNode => <TextField value={value} />}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex={['type', 'name']}
                    title="Тип"
                    render={(value: string): ReactNode => <TextField value={value} />}
                />
                <Table.Column<DirectionEntity>
                    title="Действия"
                    dataIndex="actions"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
