import { Button, InputNumber, Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import styles from './meal-plan-edit-modal.module.css';
import { useScreen } from 'shared/providers';

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
    const { isMobile } = useScreen();

    return (
        <Modal
            title={`${title} - ${dateStr}`}
            open={open}
            onCancel={onCancel}
            footer={null}
            height={400}
            width={isMobile ? undefined : 400}
            className={styles.modal}
        >
            <div className={styles.content}>
                <div className={styles.inputRow}>
                    <label className={styles.meat}>🥩 Мясоеды:</label>
                    <InputNumber
                        min={0}
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
                        min={0}
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
                <div className={styles.buttons}>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="primary" onClick={onSave} disabled={isValid}>
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
