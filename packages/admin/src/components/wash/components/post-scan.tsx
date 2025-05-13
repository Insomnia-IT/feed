import { Modal } from 'antd';

import { getUserData } from 'auth';
import { FC, useCallback } from 'react';
import { useAddWash } from '../hooks/useAddWash';
import { useSearchVolunteer } from '../hooks/useSearchVolunteer';

export interface PostScanProps {
    volunteerQr?: string;
    onClose: () => void;
}

export const PostScan: FC<PostScanProps> = ({ volunteerQr, onClose }) => {
    const { mutate: addWash, isLoading } = useAddWash();

    const { data: volunteer, isLoading: isVolunteerLoading } = useSearchVolunteer(volunteerQr);

    const handleWash = useCallback(async () => {
        const userData = await getUserData(true);

        if (!volunteer || isVolunteerLoading) return;

        if (typeof userData !== 'object' || !userData?.id) {
            alert('Ошибка: не найден ID актора');
            return;
        }

        addWash(
            {
                volunteer: volunteer.id,
                actor: Number(userData.id)
            },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (error) => {
                    console.error(error);
                    alert('Ошибка при добавлении стирки');

                    onClose();
                }
            }
        );
    }, [addWash, isVolunteerLoading, onClose, volunteer]);

    return (
        <Modal
            title="Подтверждение стирки"
            open={true}
            onOk={handleWash}
            onCancel={onClose}
            onClose={onClose}
            okText="Стирать"
            cancelText="Отмена"
            confirmLoading={isLoading}
            loading={isVolunteerLoading}
        >
            <p>Вы хотите добавить стирку для волонтера?</p>
        </Modal>
    );
};
