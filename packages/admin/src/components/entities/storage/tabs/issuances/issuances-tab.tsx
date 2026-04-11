import React from 'react';
import { Table } from 'antd';
import { useList } from '@refinedev/core';
import { useStorageData } from '../../hooks';
import type { IssuanceEntity } from 'interfaces';

export const IssuancesTab: React.FC = () => {
    const { storage } = useStorageData();

    const {
        result: issuancesData,
        query: { isLoading: issuancesLoading }
    } = useList<IssuanceEntity>({
        resource: 'storage-issuances',
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
        { dataIndex: 'volunteer_name', title: 'Кому' },
        { dataIndex: 'notes', title: 'Заметки' },
        {
            dataIndex: 'created_at',
            title: 'Дата',
            render: (val: string) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
        }
    ];

    return <Table dataSource={issuancesData?.data as any} rowKey="id" loading={issuancesLoading} columns={columns} />;
};
