import React, { useState } from 'react';
import { KitchenEntity, VolEntity } from 'interfaces';
import { useList, useNotification } from '@refinedev/core';
import { Button, Form } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import { ChangeMassEditField } from './mass-edit-types';

export const KitchenFrame: React.FC<{
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}> = ({ selectedVolunteers, doChange }) => {
    const [selectedKitchenName, setSelectedKitchenName] = useState<string | undefined>();
    const { open = () => {} } = useNotification();

    const { data: kitchensData } = useList<KitchenEntity>({
        resource: 'kitchens',
        pagination: {
            pageSize: 10000
        }
    });

    const kitchens = kitchensData?.data ?? [];

    const closeModal = () => {
        setSelectedKitchenName(undefined);
    };

    const confirmChange = () => {
        const currentKitchen = kitchens.find((kitchen) => kitchen.name === selectedKitchenName);

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
                kitchensData
            });

            return;
        }

        doChange({ fieldName: 'kitchen', fieldValue: String(currentKitchen.id) });
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
                    {kitchens.map((kitchen) => {
                        return (
                            <Button
                                style={{ width: '50%' }}
                                key={kitchen.name}
                                onClick={() => {
                                    setSelectedKitchenName(kitchen.name);
                                }}
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
                    selectedKitchenName
                }`}
                onConfirm={confirmChange}
                closeModal={closeModal}
                isOpen={!!selectedKitchenName}
            />
        </Form>
    );
};
