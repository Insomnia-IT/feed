import { FC, ReactNode } from 'react';
import { List, ShowButton, Space, Table, TextField } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList } from '@pankod/refine-core';

import type { DirectionEntity } from 'interfaces';
import { getSorter } from 'utils';

export const DepartmentList: FC<IResourceComponentsProps> = () => {
    const { data: directions } = useList<DirectionEntity>({
        resource: 'directions'
    });

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
