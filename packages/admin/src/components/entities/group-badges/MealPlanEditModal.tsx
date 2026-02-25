import { Button, InputNumber, Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import styles from './group-meal-plan.module.css';

interface MealPlanEditModalProps {
    open: boolean;
    title: string;
    dateStr: string;
    editMeat: number | null;
    editVegan: number | null;
    onMeatChange: (value: number | null) => void;
    onVeganChange: (value: number | null) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const MealPlanEditModal: React.FC<MealPlanEditModalProps> = ({
    open,
    title,
    dateStr,
    editMeat,
    editVegan,
    onMeatChange,
    onVeganChange,
    onSave,
    onCancel
}) => {
    const isValid = (editMeat !== null && editMeat < 0) || (editVegan !== null && editVegan < 0);

    return (
        <Modal title={`${title} - ${dateStr}`} open={open} onCancel={onCancel} footer={null} width={400}>
            <div className={styles.modalContent}>
                <div className={styles.inputRow}>
                    <label className={styles.meat}>🥩 Мясоеды:</label>
                    <InputNumber
                        value={editMeat}
                        onChange={onMeatChange}
                        addonAfter={
                            <Button
                                title="Очистить"
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => onMeatChange(null)}
                            />
                        }
                    />
                </div>
                <div className={styles.inputRow}>
                    <label className={styles.vegan}>🥦 Веганы:</label>
                    <InputNumber
                        value={editVegan}
                        onChange={onVeganChange}
                        addonAfter={
                            <Button
                                title="Очистить"
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => onVeganChange(null)}
                            />
                        }
                    />
                </div>
                <div className={styles.modalButtons}>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="primary" onClick={onSave} disabled={isValid}>
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
