import React from 'react';
import { Table } from 'antd';
import { useList } from '@refinedev/core';
import { useStorageData } from '../../hooks';
import type { MovementEntity, StorageItemPositionEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';

export const MovementsTab: React.FC = () => {
    const { storage } = useStorageData();

    const { result: positionsResult, query: positionsQuery } = useList<StorageItemPositionEntity>({
        resource: 'storage-positions',
        filters: [
            {
                field: 'storage',
                operator: 'eq',
                value: storage?.id
            }
        ],
        pagination: { mode: 'off' },
        queryOptions: { enabled: !!storage?.id }
    });

    const { result: movementsResult, query: movementsQuery } = useList<MovementEntity>({
        resource: 'storage-movements',
        pagination: { mode: 'off' },
        queryOptions: { enabled: !!storage?.id }
    });

    const positionsById = React.useMemo(() => {
        return new Map((positionsResult.data ?? []).map((position) => [position.id, position]));
    }, [positionsResult.data]);

    const movements = React.useMemo(() => {
        return (movementsResult.data ?? []).filter((movement) => positionsById.has(movement.position));
    }, [movementsResult.data, positionsById]);

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
            loading={positionsQuery.isLoading || movementsQuery.isLoading}
        />
    );
};
