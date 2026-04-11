import { useMemo, useState } from 'react';
import type { KitchenEntity, VolEntity } from 'interfaces';
import { useList, useNotification } from '@refinedev/core';
import { Button, Form } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import type { ChangeMassEditField } from './mass-edit-types';

export const KitchenFrame = ({
    selectedVolunteers,
    doChange
}: {
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}) => {
    const [selectedKitchenName, setSelectedKitchenName] = useState<string | undefined>();
    const { open = () => {} } = useNotification();

    const { result: kitchensResult } = useList<KitchenEntity>({
        resource: 'kitchens',
        pagination: { pageSize: 10000 }
    });

    const kitchens = kitchensResult?.data ?? [];

    const currentKitchen = useMemo(() => {
        if (!selectedKitchenName) return undefined;
        return kitchens.find((kitchen: KitchenEntity) => kitchen.name === selectedKitchenName);
    }, [kitchens, selectedKitchenName]);

    const closeModal = () => {
        setSelectedKitchenName(undefined);
    };

    const confirmChange = () => {
        if (!currentKitchen?.id) {
            open({
                message: 'Некорректная кухня!',
                description: 'Выбранная кухня не существует, либо не заполнен id',
                type: 'error',
                undoableTimeout: 5000
            });

            console.error('<KitchenFrame/> error: Выбранная кухня не существует, либо не заполнен id', {
                currentKitchen,
                selectedVolunteers,
                kitchensResult
            });

            return;
        }

        doChange({ fieldName: 'kitchen', fieldValue: String(currentKitchen.id) });
        closeModal();
    };

    return (
        <Form layout={'vertical'} style={{ width: '100%' }}>
            <Form.Item
                name="kitchen"
                layout={'vertical'}
                style={{ width: '100%' }}
                label="Выберите кухню"
                rules={[{ required: true }]}
            >
                <div style={{ display: 'flex', columnGap: '8px' }}>
                    {kitchens.map((kitchen: KitchenEntity) => {
                        return (
                            <Button
                                style={{ width: '50%' }}
                                key={kitchen.id ?? kitchen.name}
                                onClick={() => setSelectedKitchenName(kitchen.name)}
                            >
                                {kitchen.name}
                            </Button>
                        );
                    })}
                </div>
            </Form.Item>
            <ConfirmModal
                title={'Поменять кухню?'}
                description={`${getVolunteerCountText(selectedVolunteers?.length ?? 0)} и привязываете их к ${
                    selectedKitchenName ?? ''
                }`}
                onConfirm={confirmChange}
                closeModal={closeModal}
                isOpen={!!selectedKitchenName}
            />
        </Form>
    );
};
