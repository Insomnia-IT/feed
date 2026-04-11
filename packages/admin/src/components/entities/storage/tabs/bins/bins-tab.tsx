import React from 'react';
import { Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useBinsTab } from './hooks/use-bins-tab';
import { useStorageData } from '../../hooks';
import { CreateBinModal } from './create-bin-modal';

export const BinsTab: React.FC = () => {
    const { storage, filters } = useStorageData();
    const { binsData, binsLoading, binModalProps, binFormProps, showBinModal } = useBinsTab({
        storage,
        filters
    });

    const columns = [
        { dataIndex: 'name', title: 'Название' },
        { dataIndex: 'capacity', title: 'Вместимость' },
        { dataIndex: 'description', title: 'Описание' }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showBinModal()}>
                    Добавить ячейку
                </Button>
            </div>
            <Table dataSource={binsData as any} rowKey="id" loading={binsLoading} columns={columns} />
            <CreateBinModal modalProps={binModalProps} formProps={binFormProps} storageId={storage?.id} />
        </div>
    );
};
