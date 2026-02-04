import { List, ShowButton, TextField } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { useList } from '@refinedev/core';

import type { DirectionEntity } from 'interfaces';
import { getSorter } from 'utils';

export const DepartmentList = () => {
    const { result, query } = useList<DirectionEntity>({
        resource: 'directions',
        pagination: { mode: 'off' }
    });

    const directions = result.data ?? [];

    return (
        <List>
            <Table rowKey="id" dataSource={directions} loading={query.isLoading}>
                <Table.Column
                    dataIndex="name"
                    title="Название"
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex={['type', 'name']}
                    title="Тип"
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
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
