import React from 'react';
import { Table, Button, Space } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, PlusOutlined } from '@ant-design/icons';
import type { StorageItemPositionEntity, ItemEntity } from 'interfaces';
import type { ColumnsType } from 'antd/es/table';
import { usePositionsTab } from './hooks/use-positions-tab';
import { useStorageData, useStorageQrScanner } from '../../hooks';
import { ReceiveModal } from './receive-modal';
import { IssueModal } from './issue-modal';
import { CreatePositionModal } from './create-position-modal';
import { useItemOptions, useItemsTab } from '../items/hooks/use-items-tab';
import { useBinOptions } from '../bins/hooks/use-bins-tab';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';

export const PositionsTab: React.FC = () => {
    const { storage, filters } = useStorageData();
    const qrScanner = useStorageQrScanner();
    const positions = usePositionsTab({
        storage,
        filters,
        actionForm: qrScanner.actionForm
    });
    const { itemOptions } = useItemOptions();
    const { binOptions } = useBinOptions(filters);
    const { itemsTableProps } = useItemsTab();
    const itemsData = itemsTableProps.dataSource as ItemEntity[] | undefined;

    const columns: ColumnsType<StorageItemPositionEntity> = [
        { dataIndex: 'id', title: 'ID' },
        { dataIndex: 'bin_name', title: 'Ячейка' },
        { dataIndex: 'item_name', title: 'Предмет' },
        { dataIndex: 'count', title: 'Кол-во' },
        {
            title: 'Действия',
            render: (_: any, record: StorageItemPositionEntity) => (
                <Space>
                    <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => {
                            positions.setSelectedPosition(record);
                            positions.setIsReceiveModalVisible(true);
                        }}
                    >
                        Принять
                    </Button>
                    <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={record.item_is_unique && record.count === 0}
                        onClick={() => {
                            positions.setSelectedPosition(record);
                            positions.setIsIssueModalVisible(true);
                        }}
                    >
                        Выдать
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => positions.showPositionModal()}>
                    Принять
                </Button>
            </div>
            <Table {...positions.positionsTableProps} rowKey="id" columns={columns} />
            <CreatePositionModal
                modalProps={positions.positionModalProps}
                formProps={positions.positionFormProps}
                storageId={storage?.id}
                binOptions={binOptions}
                itemOptions={itemOptions}
                itemsData={itemsData}
                volunteerSelectProps={qrScanner.volunteerSelectProps}
                isVolunteerLoading={qrScanner.isVolunteerLoading}
                onOpenQrScanner={qrScanner.handleOpenQrScanner}
            />
            <ReceiveModal
                open={positions.isReceiveModalVisible}
                position={positions.selectedPosition}
                onClose={() => positions.setIsReceiveModalVisible(false)}
                onOk={() => positions.handleAction('receive')}
                form={qrScanner.actionForm}
                volunteerSelectProps={qrScanner.volunteerSelectProps}
                isVolunteerLoading={qrScanner.isVolunteerLoading}
                onOpenQrScanner={qrScanner.handleOpenQrScanner}
            />
            <IssueModal
                open={positions.isIssueModalVisible}
                position={positions.selectedPosition}
                onClose={() => positions.setIsIssueModalVisible(false)}
                onOk={() => positions.handleAction('issue')}
                form={qrScanner.actionForm}
                volunteerSelectProps={qrScanner.volunteerSelectProps}
                isVolunteerLoading={qrScanner.isVolunteerLoading}
                onOpenQrScanner={qrScanner.handleOpenQrScanner}
            />
            <QRScannerModal
                open={qrScanner.isQrModalOpen}
                onClose={() => qrScanner.setIsQrModalOpen(false)}
                onScan={qrScanner.handleQrScan}
            />
        </div>
    );
};
