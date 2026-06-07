import { Table } from 'antd';
import { useList } from '@refinedev/core';
import type { MovementEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';

export const HistoryTab = ({ userId }: { userId: number | undefined }) => {
    const { result: movementsFromResult, query: movementsFromQuery } = useList<MovementEntity>({
        resource: 'storage-movements',
        filters: [
            {
                field: 'from__id',
                operator: 'eq',
                value: userId
            }
        ],
        pagination: { mode: 'off' },
        queryOptions: { enabled: !!userId }
    });

    const { result: movementsToResult, query: movementsToQuery } = useList<MovementEntity>({
        resource: 'storage-movements',
        filters: [
            {
                field: 'to__id',
                operator: 'eq',
                value: userId
            }
        ],
        pagination: { mode: 'off' },
        queryOptions: { enabled: !!userId }
    });

    const movements = movementsFromResult.data.concat(movementsToResult.data).sort((a, b) => b.id - a.id);

    const columns: ColumnsType<MovementEntity> = [
        { dataIndex: 'id', title: 'ID' },
        {
            dataIndex: 'item_name',
            title: 'Предмет'
        },
        { dataIndex: 'count', title: 'Кол-во' },
        {
            title: 'От кого',
            render: (data: MovementEntity) => <a href={`/volunteers/edit/${data.from}`}>{data.from_name}</a>
        },
        { title: 'Кому', render: (data: MovementEntity) => <a href={`/volunteers/edit/${data.to}`}>{data.to_name}</a> },
        {
            title: 'Кем',
            render: (data: MovementEntity) => <a href={`/volunteers/edit/${data.actor}`}>{data.actor_name}</a>
        },
        {
            dataIndex: 'created_at',
            title: 'Дата',
            render: (val: string) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
        }
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={movements}
            loading={movementsFromQuery.isLoading || movementsToQuery.isLoading}
        />
    );
};
