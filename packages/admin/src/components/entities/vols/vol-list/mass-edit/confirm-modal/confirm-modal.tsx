import React from 'react';
import { Modal } from 'antd';
import styles from './confirm-modal.module.css';
import { ExclamationCircleOutlined } from '@ant-design/icons';

export const ConfirmModal: React.FC<{
    title: string;
    description: string;
    warning?: string;
    onConfirm: () => void | Promise<void>;
    closeModal: () => void;
    isOpen: boolean;
}> = ({ title, description, warning, onConfirm, closeModal, isOpen }) => {
    const onCancel = () => {
        closeModal();
    };

    const onOk = () => {
        closeModal();
        onConfirm();
    };

    return (
        <Modal
            title={
                <div className={styles.title}>
                    <ExclamationCircleOutlined className={styles.warning} /> {title}
                </div>
            }
            open={isOpen}
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
    );
};
