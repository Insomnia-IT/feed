import { Button, Modal, Typography } from 'antd';

const { Text } = Typography;

interface MealPlanReadonlyModalProps {
    open: boolean;
    title: string;
    dateStr: string;
    message: string;
    onClose: () => void;
}

export const MealPlanReadonlyModal: React.FC<MealPlanReadonlyModalProps> = ({
    open,
    title,
    dateStr,
    message,
    onClose
}) => {
    return (
        <Modal
            title={`${title} - ${dateStr}`}
            open={open}
            onCancel={onClose}
            footer={
                <Button type="primary" onClick={onClose}>
                    Закрыть
                </Button>
            }
            width={400}
        >
            <Text>{message}</Text>
        </Modal>
    );
};
