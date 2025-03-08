import React, { useState } from 'react';
import { KitchenEntity, VolEntity } from 'interfaces';
import { useList } from '@refinedev/core';
import { Button, Form } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';

export const KitchenFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [selectedKitchenName, setSelectedKitchenName] = useState<string | undefined>();

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

        console.log('changeKitchen to ', currentKitchen);

        closeModal();
    };

    return (
        <Form layout={'vertical'} style={{ width: '100%' }}>
            <Form.Item
                name="kitchen"
                layout={'vertical'}
                style={{ width: '100%' }}
                label="Выберете кухню"
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
