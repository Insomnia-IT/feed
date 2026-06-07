import { Button } from 'antd';

import { InventoryTable } from './inventory-table';
import { InventoryTransferModal } from './inventory-transfer-modal';
import type { InventorySectionProps } from './types';
import { useInventoryTransfer } from './use-inventory-transfer';
import { useVolunteerInventory } from './use-volunteer-inventory';

import styles from '../../../common.module.css';
import { useState } from 'react';
import { HistoryTab } from './history-tab';

export const InventorySection = ({ volunteerId, volunteerName, isCreationProcess }: InventorySectionProps) => {
    const targetInventory = useVolunteerInventory(volunteerId);
    const transfer = useInventoryTransfer({
        volunteerId,
        reloadTargetInventory: targetInventory.reload
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
                    <Button
                        type="primary"
                        htmlType="button"
                        onClick={transfer.openTransferModal}
                        disabled={!volunteerId || !transfer.userId}
                    >
                        Передать
                    </Button>
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
        </>
    );
};
