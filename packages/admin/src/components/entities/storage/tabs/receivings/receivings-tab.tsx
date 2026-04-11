import React from 'react';
import { Table } from 'antd';
import { useList } from '@refinedev/core';
import { useStorageData } from '../../hooks';
import type { ReceivingEntity } from 'interfaces';

export const ReceivingsTab: React.FC = () => {
    const { storage } = useStorageData();

    const {
        result: receivingsData,
        query: { isLoading: receivingsLoading }
    } = useList<ReceivingEntity>({
        resource: 'storage-receivings',
        filters: [
            {
                field: 'position__storage',
                operator: 'eq',
                value: storage?.id
            }
        ],
        queryOptions: { enabled: !!storage?.id }
    });

    const columns = [
        { dataIndex: 'id', title: 'ID' },
        { dataIndex: 'item_name', title: 'Предмет' },
        { dataIndex: 'count', title: 'Кол-во' },
        { dataIndex: 'volunteer_name', title: 'От кого' },
        { dataIndex: 'notes', title: 'Заметки' },
        {
            dataIndex: 'created_at',
            title: 'Дата',
            render: (val: string) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
        }
    ];

    return <Table dataSource={receivingsData?.data as any} rowKey="id" loading={receivingsLoading} columns={columns} />;
};
