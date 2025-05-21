import React, { useState } from 'react';
import type { CustomFieldEntity, VolEntity } from 'interfaces';
import { Button } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { useList, useNotification } from '@refinedev/core';
import { HAS_BADGE_FIELD_NAME } from 'const';
import { ChangeMassEditField } from './mass-edit-types';

export const HasBadgeButton: React.FC<{ selectedVolunteers: VolEntity[]; doChange: ChangeMassEditField }> = ({
    selectedVolunteers,
    doChange
}) => {
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState<boolean>(false);
    const { data } = useList<CustomFieldEntity>({ resource: 'volunteer-custom-fields', pagination: { pageSize: 0 } });
    const { open = () => {} } = useNotification();

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
            open({
                message: `Функционал сломан. Не найден id кастомного поля "${HAS_BADGE_FIELD_NAME}"`,
                type: 'error',
                undoableTimeout: 5000
            });

            console.error(
                `<HasBadgeButton/> error: Функционал сломан. Не найден id кастомного поля "${HAS_BADGE_FIELD_NAME}"`,
                { data, HAS_BADGE_FIELD_ID, HAS_BADGE_FIELD_NAME }
            );

            return;
        }

        doChange({
            isCustom: true,
            fieldName: String(HAS_BADGE_FIELD_ID),
            fieldValue: 'true'
        });
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
                closeModal={closeModal}
                isOpen={isTicketsModalOpen}
            />
        </>
    );
};
