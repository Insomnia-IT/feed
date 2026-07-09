import { useMemo } from 'react';
import { Table } from 'antd';
import { useList } from '@refinedev/core';
import type { IssuanceEntity, MovementEntity, ReceivingEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';

type HistoryType = 'movement' | 'issuance' | 'receiving';

type InventoryHistoryRecord =
    | (MovementEntity & { historyType: 'movement'; rowKey: string })
    | (IssuanceEntity & { historyType: 'issuance'; rowKey: string })
    | (ReceivingEntity & { historyType: 'receiving'; rowKey: string });

const getVolunteerLink = (id?: number | null, name?: string | null) => {
    if (!id) {
        return name || '-';
    }

    return <a href={`/volunteers/edit/${id}`}>{name || id}</a>;
};

const getEventDate = (record: InventoryHistoryRecord) => record.created_at || '';

const normalizeHistoryRecords = <T extends MovementEntity | IssuanceEntity | ReceivingEntity>(
    items: T[],
    historyType: HistoryType
) =>
    items.map((item) => ({
        ...item,
        historyType,
        rowKey: `${historyType}-${item.id}`
    })) as InventoryHistoryRecord[];

export const HistoryTab = ({ userId }: { userId: number | undefined }) => {
    const queryOptions = useMemo(() => ({ enabled: !!userId }), [userId]);

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
        queryOptions
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
        queryOptions
    });

    const { result: issuancesResult, query: issuancesQuery } = useList<IssuanceEntity>({
        resource: 'storage-issuances',
        filters: [
            {
                field: 'volunteer',
                operator: 'eq',
                value: userId
            }
        ],
        pagination: { mode: 'off' },
        queryOptions
    });

    const { result: receivingsResult, query: receivingsQuery } = useList<ReceivingEntity>({
        resource: 'storage-receivings',
        filters: [
            {
                field: 'volunteer',
                operator: 'eq',
                value: userId
            }
        ],
        pagination: { mode: 'off' },
        queryOptions
    });

    const history = useMemo(() => {
        const movementsById = new Map<number, MovementEntity>();

        movementsFromResult.data.concat(movementsToResult.data).forEach((movement) => {
            movementsById.set(movement.id, movement);
        });

        return normalizeHistoryRecords(Array.from(movementsById.values()), 'movement')
            .concat(normalizeHistoryRecords(issuancesResult.data, 'issuance'))
            .concat(normalizeHistoryRecords(receivingsResult.data, 'receiving'))
            .sort((a, b) => getEventDate(b).localeCompare(getEventDate(a)) || b.id - a.id);
    }, [issuancesResult.data, movementsFromResult.data, movementsToResult.data, receivingsResult.data]);

    const columns = useMemo<ColumnsType<InventoryHistoryRecord>>(
        () => [
            {
                title: 'Тип',
                render: (data) => {
                    if (data.historyType === 'issuance') {
                        return 'Со склада';
                    }
                    if (data.historyType === 'receiving') {
                        return 'На склад';
                    }
                    return 'Между волонтерами';
                }
            },
            { dataIndex: 'id', title: 'ID' },
            { dataIndex: 'item_name', title: 'Предмет' },
            { dataIndex: 'storage_name', title: 'Склад' },
            { dataIndex: 'count', title: 'Кол-во' },
            {
                title: 'От кого',
                render: (data) => {
                    if (data.historyType === 'issuance') {
                        return data.storage_name || 'Склад';
                    }
                    if (data.historyType === 'receiving') {
                        return getVolunteerLink(data.volunteer, data.volunteer_name);
                    }
                    return getVolunteerLink(data.from, data.from_name);
                }
            },
            {
                title: 'Кому',
                render: (data) => {
                    if (data.historyType === 'issuance') {
                        return getVolunteerLink(data.volunteer, data.volunteer_name);
                    }
                    if (data.historyType === 'receiving') {
                        return data.storage_name || 'Склад';
                    }
                    return getVolunteerLink(data.to, data.to_name);
                }
            },
            {
                title: 'Кем',
                render: (data) => getVolunteerLink(data.actor, data.actor_name)
            },
            { dataIndex: 'notes', title: 'Заметки' },
            {
                dataIndex: 'created_at',
                title: 'Дата',
                render: (val: string) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
            }
        ],
        []
    );

    return (
        <Table
            rowKey="rowKey"
            columns={columns}
            dataSource={history}
            loading={
                movementsFromQuery.isLoading ||
                movementsToQuery.isLoading ||
                issuancesQuery.isLoading ||
                receivingsQuery.isLoading
            }
        />
    );
};
