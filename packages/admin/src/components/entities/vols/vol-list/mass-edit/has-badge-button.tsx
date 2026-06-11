import { useState } from 'react';
import type { VolEntity } from 'interfaces';
import { Button } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import type { ChangeMassEditField } from './mass-edit-types';

const HAS_BADGE_FIELD_NAME = 'is_badge_located_at_leader';

export const HasBadgeButton = ({
    selectedVolunteers,
    doChange
}: {
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}) => {
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

    const getWarningText = () => {
        const alreadyHasBadge = selectedVolunteers.some((vol) => !!vol[HAS_BADGE_FIELD_NAME]);

        if (alreadyHasBadge) {
            return 'Часть выбранных волонтеров уже имеет бейдж';
        }

        return undefined;
    };

    const closeModal = () => setIsTicketsModalOpen(false);

    const onConfirm = () => {
        doChange({
            isCustom: false,
            fieldName: String(HAS_BADGE_FIELD_NAME),
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
