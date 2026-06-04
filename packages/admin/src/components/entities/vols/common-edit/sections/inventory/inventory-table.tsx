import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { InventoryRow } from './types';

interface InventoryTableProps {
    inventory: InventoryRow[];
    isLoading: boolean;
}

const inventoryColumns: ColumnsType<InventoryRow> = [
    {
        title: 'Предмет',
        render: (_, item) => item.positionData?.item_name || `Позиция ${item.position}`
    },
    {
        title: 'Склад',
        render: (_, item) => item.positionData?.storage_name || 'Не указан'
    },
    {
        title: 'Ячейка',
        render: (_, item) => item.positionData?.bin_name || 'Не указана'
    },
    { dataIndex: 'count', title: 'Кол-во' }
];

export const InventoryTable = ({ inventory, isLoading }: InventoryTableProps) => (
    <Table
        rowKey="position"
        columns={inventoryColumns}
        dataSource={inventory}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: 'Инвентарь не найден' }}
    />
);
