import React from 'react';
import { Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { EditButton, DeleteButton } from '@refinedev/antd';
import type { BinEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';
import { useBinsTab } from './hooks/use-bins-tab';
import { useStorageData } from '../../hooks';
import { BinModal } from './bin-modal';

export const BinsTab: React.FC = () => {
    const { storage, filters } = useStorageData();
    const {
        binsTableProps,
        createModalProps,
        createFormProps,
        showCreateModal,
        editModalProps,
        editFormProps,
        showEditModal
    } = useBinsTab({
        storage,
        filters
    });

    const columns: ColumnsType<BinEntity> = [
        { dataIndex: 'name', title: 'Название' },
        { dataIndex: 'capacity', title: 'Вместимость' },
        { dataIndex: 'description', title: 'Описание' },
        {
            title: 'Действия',
            dataIndex: 'actions',
            render: (_, record) => (
                <Space>
                    <EditButton hideText size="small" onClick={() => showEditModal(record.id)} />
                    <DeleteButton hideText size="small" recordItemId={record.id} resource="storage-bins" />
                </Space>
            )
        }
    ];

    if (!storage) {
        return null;
    }

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showCreateModal()}>
                    Добавить ячейку
                </Button>
            </div>
            <Table {...binsTableProps} rowKey="id" columns={columns} />
            <BinModal
                modalProps={createModalProps}
                formProps={createFormProps}
                storageId={storage.id}
                action="create"
            />
            <BinModal modalProps={editModalProps} formProps={editFormProps} storageId={storage.id} action="edit" />
        </div>
    );
};
