import React from 'react';
import { Table } from 'antd';
import { useTable } from '@refinedev/antd';
import { useStorageData } from '../../hooks';
import type { ReceivingEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';

export const ReceivingsTab: React.FC = () => {
    const { storage } = useStorageData();

    const { tableProps: receivingsTableProps } = useTable<ReceivingEntity>({
        resource: 'storage-receivings',
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

    const columns: ColumnsType<ReceivingEntity> = [
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

    return <Table {...receivingsTableProps} rowKey="id" columns={columns} />;
};
