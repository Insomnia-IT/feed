import React, { useState } from 'react';
import type { VolEntity } from '../../../../../interfaces';
import { Button } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { ConfirmModal } from './confirm-modal/confirm-modal.tsx';

export const HasBadgeButton: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState<boolean>(false);

    const getWarningText = () => {
        // TODO: сделать реальную проверку
        if (selectedVolunteers.length % 2 === 1) {
            return 'Часть выбранных волонтеров уже имеет бейдж';
        }
    };

    return (
        <>
            <Button onClick={() => setIsTicketsModalOpen(true)}>
                <IdcardOutlined />
                Выдан бейдж
            </Button>
            <ConfirmModal
                title={'Выдать билеты?'}
                description={`Вы выбрали ${selectedVolunteers.length} волонтеров и выдаете им бейджи. Проверяйте несколько раз, каких волонтеров вы выбираете!`}
                warning={getWarningText()}
                onConfirm={() => {}}
                closeModal={() => setIsTicketsModalOpen(false)}
                isOpen={isTicketsModalOpen}
            />
        </>
    );
};
