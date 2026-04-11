import React from 'react';
import { Table, Button, Space, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ItemEntity } from 'interfaces';
import { useItemsTab } from './hooks/use-items-tab';
import { CreateItemModal } from './create-item-modal';
import { EditItemModal } from './edit-item-modal';

export const ItemsTab: React.FC = () => {
    const {
        storageId,
        itemsData,
        itemsLoading,
        itemModalProps,
        itemFormProps,
        showItemModal,
        editItemModalProps,
        editItemFormProps,
        showEditItemModal,
        deleteMutate,
        itemsRefetch
    } = useItemsTab();

    const columns = [
        { dataIndex: 'name', title: 'Название' },
        { dataIndex: 'sku', title: 'Артикул / SKU' },
        { dataIndex: 'storage_name', title: 'Склад' },
        {
            dataIndex: 'is_unique',
            title: 'Уникальный',
            render: (val: boolean) => (val ? 'Да' : 'Нет')
        },
        {
            dataIndex: 'is_anonymous',
            title: 'Анонимный',
            render: (val: boolean) => (val ? 'Да' : 'Нет')
        },
        {
            title: 'Действия',
            render: (_: any, record: ItemEntity) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => showEditItemModal(record.id)} />
                    <Popconfirm
                        title="Удалить предмет?"
                        onConfirm={() => {
                            deleteMutate(
                                {
                                    resource: 'storage-items',
                                    id: record.id
                                },
                                {
                                    onSuccess: () => {
                                        itemsRefetch();
                                    }
                                }
                            );
                        }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showItemModal()}>
                    Добавить предмет
                </Button>
            </div>
            <Table dataSource={itemsData} rowKey="id" loading={itemsLoading} columns={columns} pagination={false} />
            <CreateItemModal storageId={storageId} modalProps={itemModalProps} formProps={itemFormProps} />
            <EditItemModal modalProps={editItemModalProps} formProps={editItemFormProps} />
        </div>
    );
};
