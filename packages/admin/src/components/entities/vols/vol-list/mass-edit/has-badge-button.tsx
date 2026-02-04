import { useMemo, useState } from 'react';
import type { CustomFieldEntity, VolEntity } from 'interfaces';
import { Button } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { useList, useNotification } from '@refinedev/core';
import { HAS_BADGE_FIELD_NAME } from 'const';
import type { ChangeMassEditField } from './mass-edit-types';

export const HasBadgeButton = ({
    selectedVolunteers,
    doChange
}: {
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}) => {
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

    const { result } = useList<CustomFieldEntity>({
        resource: 'volunteer-custom-fields',
        pagination: { pageSize: 0 }
    });

    const { open = () => {} } = useNotification();

    const HAS_BADGE_FIELD_ID = useMemo(() => {
        return (result?.data ?? []).find((field: CustomFieldEntity) => field.name === HAS_BADGE_FIELD_NAME)?.id;
    }, [result?.data]);

    const getWarningText = () => {
        if (!HAS_BADGE_FIELD_ID) {
            return 'Функционал сломан!!!';
        }

        const alreadyHasBadge = selectedVolunteers.some((vol) =>
            vol.custom_field_values?.some((v) => v.custom_field === HAS_BADGE_FIELD_ID)
        );

        if (alreadyHasBadge) {
            return 'Часть выбранных волонтеров уже имеет бейдж';
        }

        return undefined;
    };

    const closeModal = () => setIsTicketsModalOpen(false);

    const onConfirm = () => {
        if (!HAS_BADGE_FIELD_ID) {
            open({
                message: `Функционал сломан. Не найден id кастомного поля "${HAS_BADGE_FIELD_NAME}"`,
                type: 'error',
                undoableTimeout: 5000
            });

            console.error(
                `<HasBadgeButton/> error: Функционал сломан. Не найден id кастомного поля "${HAS_BADGE_FIELD_NAME}"`,
                { result, HAS_BADGE_FIELD_ID, HAS_BADGE_FIELD_NAME }
            );

            return;
        }

        doChange({
            isCustom: true,
            fieldName: String(HAS_BADGE_FIELD_ID),
            fieldValue: 'true'
        });

        closeModal();
    };

    return (
        <>
            <Button onClick={() => setIsTicketsModalOpen(true)}>
                <IdcardOutlined />
                Бейдж у рук-ля
            </Button>
            <ConfirmModal
                title="Выдать бейдж?"
                description={`Вы выбрали ${selectedVolunteers.length} волонтеров и выдаете им бейджи. Проверяйте несколько раз, каких волонтеров вы выбираете!`}
                warning={getWarningText()}
                onConfirm={onConfirm}
                closeModal={closeModal}
                isOpen={isTicketsModalOpen}
            />
        </>
    );
};
