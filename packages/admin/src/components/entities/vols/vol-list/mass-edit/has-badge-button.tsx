import React, { useState } from 'react';
import type { CustomFieldEntity, VolEntity } from 'interfaces';
import { Button } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { useList } from '@refinedev/core';
import { HAS_BADGE_FIELD_NAME } from 'const';

export const HasBadgeButton: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState<boolean>(false);
    const { data } = useList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' });

    const HAS_BADGE_FIELD_ID = (data?.data ?? []).find((field) => field.name === HAS_BADGE_FIELD_NAME)?.id;

    const getWarningText = () => {
        if (!HAS_BADGE_FIELD_ID) {
            return 'Функционал сломан!!!';
        }

        if (
            selectedVolunteers.some((vol) =>
                vol.custom_field_values.find((field) => field.custom_field === HAS_BADGE_FIELD_ID)
            )
        ) {
            return 'Часть выбранных волонтеров уже имеет бейдж';
        }
    };

    const closeModal = () => {
        setIsTicketsModalOpen(false);
    };

    const onConfirm = () => {
        if (!HAS_BADGE_FIELD_ID) {
            return;
        }

        closeModal();
    };

    return (
        <>
            <Button onClick={() => setIsTicketsModalOpen(true)}>
                <IdcardOutlined />
                Выдан бейдж
            </Button>
            <ConfirmModal
                title={'Выдать бейдж?'}
                description={`Вы выбрали ${selectedVolunteers.length} волонтеров и выдаете им бейджи. Проверяйте несколько раз, каких волонтеров вы выбираете!`}
                warning={getWarningText()}
                onConfirm={onConfirm}
                closeModal={() => setIsTicketsModalOpen(false)}
                isOpen={isTicketsModalOpen}
            />
        </>
    );
};
