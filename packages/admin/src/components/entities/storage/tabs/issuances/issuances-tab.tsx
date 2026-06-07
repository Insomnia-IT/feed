import React from 'react';
import { Table } from 'antd';
import { useTable } from '@refinedev/antd';
import { useStorageData } from '../../hooks';
import type { IssuanceEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';

export const IssuancesTab: React.FC = () => {
    const { storage } = useStorageData();

    const { tableProps: issuancesTableProps } = useTable<IssuanceEntity>({
        resource: 'storage-issuances',
        filters: {
            initial: [
                {
                    field: 'position__storage',
                    operator: 'eq',
                    value: storage?.id
                }
            ]
        },
        pagination: { mode: 'server' },
        queryOptions: { enabled: !!storage?.id }
    });

    const columns: ColumnsType<IssuanceEntity> = [
        { dataIndex: 'id', title: 'ID' },
        { dataIndex: 'item_name', title: 'Предмет' },
        { dataIndex: 'count', title: 'Кол-во' },
        {
            title: 'Кому',
            render: (data: IssuanceEntity) => <a href={`/volunteers/edit/${data.volunteer}`}>{data.volunteer_name}</a>
        },
        {
            title: 'Кем',
            render: (data: IssuanceEntity) => <a href={`/volunteers/edit/${data.actor}`}>{data.actor_name}</a>
        },
        { dataIndex: 'notes', title: 'Заметки' },
        {
            dataIndex: 'created_at',
            title: 'Дата',
            render: (val: string) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
        }
    ];

    return <Table {...issuancesTableProps} rowKey="id" columns={columns} />;
};
