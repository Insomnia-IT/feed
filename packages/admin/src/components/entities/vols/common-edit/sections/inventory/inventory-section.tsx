import { Button } from 'antd';

import { InventoryTable } from './inventory-table';
import { InventoryTransferModal } from './inventory-transfer-modal';
import { StorageIssueModal } from './storage-issue-modal';
import type { InventorySectionProps } from './types';
import { useInventoryTransfer } from './use-inventory-transfer';
import { useVolunteerInventory } from './use-volunteer-inventory';
import { useStorageIssue } from './use-storage-issue';

import styles from '../../../common.module.css';
import { useState } from 'react';
import { HistoryTab } from './history-tab';
import useCanAccess from 'components/entities/vols/use-can-access';

export const InventorySection = ({ volunteerId, volunteerName, isCreationProcess }: InventorySectionProps) => {
    const canStorageEdit = useCanAccess({ action: 'storage_edit', resource: 'volunteers' });
    const targetInventory = useVolunteerInventory(volunteerId);
    const transfer = useInventoryTransfer({
        volunteerId,
        reloadTargetInventory: targetInventory.reload
    });
    const storageIssue = useStorageIssue({
        volunteerId,
        reloadInventory: targetInventory.reload
    });
    const [showHistory, setShowHistory] = useState(false);

    if (isCreationProcess) {
        return null;
    }

    return (
        <>
            <div className={styles.inventoryHeader}>
                <Button htmlType="button" onClick={() => setShowHistory(!showHistory)}>
                    {showHistory ? 'Инвентарь' : 'История'}
                </Button>
                {!showHistory && (
                    <>
                        {canStorageEdit && (
                            <Button
                                type="primary"
                                htmlType="button"
                                onClick={storageIssue.openModal}
                                disabled={!volunteerId}
                            >
                                Выдать со склада
                            </Button>
                        )}
                        <Button
                            type="primary"
                            htmlType="button"
                            onClick={transfer.openTransferModal}
                            disabled={!volunteerId || !transfer.userId}
                        >
                            Передать из личного инвентаря
                        </Button>
                    </>
                )}
            </div>
            {showHistory ? (
                <HistoryTab userId={transfer.userId} />
            ) : (
                <InventoryTable inventory={targetInventory.inventory} isLoading={targetInventory.isLoading} />
            )}

            <InventoryTransferModal
                open={transfer.isTransferModalOpen}
                volunteerId={volunteerId}
                volunteerName={volunteerName}
                form={transfer.transferForm}
                isTransferLoading={transfer.isTransferLoading}
                sourceVolunteerId={transfer.sourceVolunteerId}
                sourceInventoryLoading={transfer.sourceInventory.isLoading}
                selectedSourceInventoryItem={transfer.selectedSourceInventoryItem}
                itemOptions={transfer.itemOptions}
                onClose={transfer.closeTransferModal}
                onSubmit={transfer.handleTransfer}
                onSourceChange={transfer.handleSourceChange}
                onPositionChange={transfer.handlePositionChange}
            />

            <StorageIssueModal
                open={storageIssue.isOpen}
                volunteerId={volunteerId}
                volunteerName={volunteerName}
                form={storageIssue.form}
                isLoading={storageIssue.isLoading}
                storageSelectProps={storageIssue.storageSelectProps}
                positionOptions={storageIssue.positionOptions}
                selectedPosition={storageIssue.selectedPosition}
                onClose={storageIssue.closeModal}
                onIssue={storageIssue.handleIssue}
                onStorageChange={storageIssue.handleStorageChange}
                onPositionChange={storageIssue.handlePositionChange}
            />
        </>
    );
};
