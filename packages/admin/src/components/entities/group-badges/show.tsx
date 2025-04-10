import { Show, TextField } from '@refinedev/antd';
import { Table, Typography } from 'antd';
import { useShow, useTable } from '@refinedev/core';
import { FC } from 'react';

import type { GroupBadgeEntity, VolEntity } from 'interfaces';
import { TextEditor } from 'components/controls/text-editor';

const { Text, Title } = Typography;

export const GroupBadgeShow: FC = () => {
    const { queryResult, showId } = useShow<GroupBadgeEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    const { tableQuery, current, pageSize } = useTable<VolEntity>({
        resource: 'volunteers',
        filters: {
            initial: [
                {
                    field: 'group_badge',
                    operator: 'eq',
                    value: showId
                }
            ]
        },
        sorters: {
            initial: [
                {
                    field: 'id',
                    order: 'desc'
                }
            ]
        }
    });

    const tableRows = tableQuery.data?.data || [];
    const isTableLoading = tableQuery.isFetching;

    return (
        <Show isLoading={isLoading || isTableLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>QR</Title>
            <Text>{record?.qr}</Text>

            <Title level={5}>Комментарий</Title>

            <TextEditor theme="bubble" readOnly value={record?.comment} />

            <Title level={5}>Волонтеры</Title>
            <Table
                dataSource={tableRows}
                rowKey="id"
                pagination={{
                    current,
                    pageSize
                }}
            >
                <Table.Column
                    dataIndex="name"
                    key="name"
                    title="Имя на бейдже"
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex="first_name"
                    key="first_name"
                    title="Имя"
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex="last_name"
                    key="last_name"
                    title="Фамилия"
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex="directions"
                    key="directions"
                    title="Службы"
                    render={(value) => <TextField value={value.map(({ name }: { name: string }) => name).join(', ')} />}
                />
            </Table>
        </Show>
    );
};
