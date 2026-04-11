import React from 'react';
import { Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { BinEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';
import { useBinsTab } from './hooks/use-bins-tab';
import { useStorageData } from '../../hooks';
import { CreateBinModal } from './create-bin-modal';

export const BinsTab: React.FC = () => {
    const { storage, filters } = useStorageData();
    const { binsTableProps, binModalProps, binFormProps, showBinModal } = useBinsTab({
        storage,
        filters
    });

    const columns: ColumnsType<BinEntity> = [
        { dataIndex: 'name', title: 'Название' },
        { dataIndex: 'capacity', title: 'Вместимость' },
        { dataIndex: 'description', title: 'Описание' }
    ];

    if (!storage) {
        return null;
    }

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showBinModal()}>
                    Добавить ячейку
                </Button>
            </div>
            <Table {...binsTableProps} rowKey="id" columns={columns} />
            <CreateBinModal modalProps={binModalProps} formProps={binFormProps} storageId={storage.id} />
        </div>
    );
};
