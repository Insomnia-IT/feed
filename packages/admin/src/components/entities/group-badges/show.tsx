import { useMemo } from 'react';
import { Show, TextField } from '@refinedev/antd';
import { useShow, useTable } from '@refinedev/core';
import { Table, Typography } from 'antd';

import type { GroupBadgeEntity, VolEntity } from 'interfaces';
import { TextEditor } from 'components/controls/text-editor';

const { Text, Title } = Typography;

type DirectionLike = { name: string };
type VolWithDirections = VolEntity & { directions?: DirectionLike[] };

export const GroupBadgeShow = () => {
    const { query, result: record, showId } = useShow<GroupBadgeEntity>();

    const {
        tableQuery,
        result: tableResult,
        currentPage,
        pageSize,
        setCurrentPage,
        setPageSize
    } = useTable<VolWithDirections>({
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
            initial: [{ field: 'id', order: 'desc' }]
        }
    });

    const tableRows = useMemo(() => tableResult.data ?? [], [tableResult.data]);

    const isShowLoading = query.isLoading || query.isFetching;
    const isTableLoading = tableQuery.isLoading || tableQuery.isFetching;

    return (
        <Show isLoading={isShowLoading || isTableLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>QR</Title>
            <Text>{record?.qr}</Text>

            <Title level={5}>Комментарий</Title>
            <TextEditor theme="bubble" readOnly value={record?.comment ?? ''} />

            <Title level={5}>Волонтеры</Title>
            <Table
                dataSource={tableRows}
                rowKey="id"
                loading={isTableLoading}
                pagination={{
                    current: currentPage,
                    pageSize,
                    onChange: (nextPage, nextSize) => {
                        setCurrentPage(nextPage);
                        if (nextSize) setPageSize(nextSize);
                    }
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
                    render={(value?: DirectionLike[]) => (
                        <TextField value={(value ?? []).map((d) => d.name).join(', ')} />
                    )}
                />
            </Table>
        </Show>
    );
};
