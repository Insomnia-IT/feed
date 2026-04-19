import React from 'react';
import { Modal, Typography } from 'antd';

const { Title, Text } = Typography;

interface PositionSuccessModalProps {
    open: boolean;
    positionId?: number;
    onClose: () => void;
}

export const PositionSuccessModal: React.FC<PositionSuccessModalProps> = ({ open, positionId, onClose }) => {
    return (
        <Modal title="Позиция успешно создана" open={open} onCancel={onClose} footer={null} centered width={400}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Text type="secondary">ID созданной позиции:</Text>
                <Title level={1} style={{ fontSize: '120px', margin: '24px 0', lineHeight: 1 }}>
                    {positionId}
                </Title>
                <Text style={{ fontSize: '18px', display: 'block' }}>Пожалуйста, подпишите предмет этим номером.</Text>
            </div>
        </Modal>
    );
};
