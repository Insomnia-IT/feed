import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import styles from './confirm-modal.module.css';
import { ExclamationCircleOutlined } from '@ant-design/icons';

export const ConfirmModal: React.FC<{
    title: string;
    description: string;
    warning?: string;
    disabled?: boolean;
    onConfirm: () => void | Promise<void>;
}> = ({ title, description, warning, disabled = false, onConfirm }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const onCancel = () => setIsModalOpen(false);
    const onOk = () => {
        setIsModalOpen(false);
        onConfirm();
    };

    return (
        <>
            <Button
                className={styles.trigger}
                type={'primary'}
                onClick={() => setIsModalOpen(true)}
                disabled={disabled}
            >
                Подтвердить
            </Button>
            <Modal
                title={
                    <div className={styles.title}>
                        <ExclamationCircleOutlined className={styles.warning} /> {title}
                    </div>
                }
                open={isModalOpen}
                onCancel={onCancel}
                onOk={onOk}
                okText={'Подтвердить'}
                onClose={onCancel}
                cancelText={'Отменить'}
            >
                <div className={styles.text}>
                    <div>{description}</div>
                    <div>Проверяйте несколько раз, каких волонтеров вы выбираете!</div>
                    <div>{warning}</div>
                </div>
            </Modal>
        </>
    );
};
