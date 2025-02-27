import React, { useState } from 'react';
import type { StatusEntity, TransportEntity, VolEntity } from 'interfaces';
import { useSelect } from '@refinedev/core';
import { Button, DatePicker, Form, Select } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';

export const ArrivalsFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { options: statusesOptions } = useSelect<StatusEntity>({ resource: 'statuses', optionLabel: 'name' });

    const { options: transportsOptions } = useSelect<TransportEntity>({ resource: 'transports', optionLabel: 'name' });

    const statusesOptionsNew =
        statusesOptions?.map((item) =>
            ['ARRIVED', 'STARTED', 'JOINED'].includes(item.value as string)
                ? { ...item, label: `✅ ${item.label}` }
                : item
        ) ?? [];

    const confirmChange = () => {
        setIsModalOpen(false);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <Form>
            <Form.Item
                style={{ paddingBottom: '5px' }}
                layout={'vertical'}
                name={'dates'}
                label={'Даты заезда'}
                rules={[{ required: true }]}
            >
                <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item
                style={{ paddingBottom: '5px' }}
                layout={'vertical'}
                name={'status'}
                label={'Статус'}
                rules={[{ required: true }]}
            >
                <Select options={statusesOptionsNew} />
            </Form.Item>
            <Form.Item
                style={{ paddingBottom: '5px' }}
                layout={'vertical'}
                name={'arrived'}
                label={'Как добрался'}
                rules={[{ required: true }]}
            >
                <Select options={transportsOptions} />
            </Form.Item>
            <Form.Item style={{ paddingBottom: '15px' }} layout={'vertical'} name={'departed'} label={'Как уехал'}>
                <Select options={transportsOptions} />
            </Form.Item>
            <Button
                type={'primary'}
                style={{ width: '100%' }}
                onClick={() => {
                    setIsModalOpen(true);
                }}
            >
                Подтвердить
            </Button>
            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                title={'Поменять данные заездов?'}
                description={`${getVolunteerCountText(selectedVolunteers.length)} и меняете данные заездов.`}
                onConfirm={confirmChange}
            />
        </Form>
    );
};
