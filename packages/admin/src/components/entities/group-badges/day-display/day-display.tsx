import React from 'react';
import type { MealPlanRowRender } from '../useGroupMealPlanData';
import { Card, Modal, Button } from 'antd';
import styles from './day-display.module.css';
import dayjs from 'dayjs';
import cn from 'classnames';

const formatMeals = (meals: { amount_meat: number | null; amount_vegan: number | null }, isMobile: boolean = false) => {
    if (meals?.amount_meat === null && meals?.amount_vegan === null) {
        return '-/-';
    }

    const meat = meals?.amount_meat ?? '-';
    const vegan = meals?.amount_vegan ?? '-';

    return isMobile ? `${meat}/${vegan}` : `🥩 ${meat}/${vegan} 🥦`;
};

type OnCellClick = (params: {
    date: dayjs.Dayjs;
    mealType: string;
    mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
    meals: { amount_meat: number | null; amount_vegan: number | null };
    editable: boolean;
    message?: string;
}) => void;

interface MealCellProps {
    value: { amount_meat: number | null; amount_vegan: number | null };
    record: MealPlanRowRender;
    mealType: string;
    mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
    isMobile: boolean;
    onClick: OnCellClick;
}

export const MealCell: React.FC<MealCellProps> = ({ value, record, mealType, mealTypeKey, isMobile, onClick }) => {
    const showWarningMessage = record.date.isSame(dayjs(), 'day') && !record.editable;

    if (!record.editable && !showWarningMessage) {
        return <span className={styles.mealCell}>{formatMeals(value, isMobile)}</span>;
    }

    return (
        <Button
            color="default"
            variant="outlined"
            className={cn(styles.mealCell, styles.editable)}
            onClick={() => {
                if (showWarningMessage) {
                    Modal.warning({
                        title: 'Невозможно редактировать',
                        content:
                            record.readonlyMessage || 'После 21:00 следующий день можно редактировать только через бюро'
                    });
                } else {
                    onClick({
                        date: record.date,
                        mealType,
                        mealTypeKey,
                        meals: value,
                        editable: record.editable,
                        message: record.readonlyMessage
                    });
                }
            }}
        >
            {formatMeals(value, isMobile)}
        </Button>
    );
};

export const MobileDayCard: React.FC<{
    record: MealPlanRowRender;
    isToday: boolean;
    onCellClick: OnCellClick;
    isMobile: boolean;
}> = ({ record, isToday, onCellClick, isMobile }) => (
    <Card className={`${styles.mobileCard} ${isToday ? styles.todayCard : ''}`} size="small">
        <div className={styles.mobileCardHeader}>
            <span className={styles.dayName}>{record.date.format('dddd')}</span>
            <span className={styles.dateValue}>{record.date.format('DD.MM')}</span>
        </div>
        <div className={styles.mobileMealsRow}>
            <div className={styles.mobileMealCell}>
                <span className={styles.mobileMealLabel}>Завтрак</span>
                <MealCell
                    value={record.breakfast}
                    record={record}
                    mealType="Завтрак"
                    mealTypeKey="breakfast"
                    isMobile={isMobile}
                    onClick={onCellClick}
                />
            </div>
            <div className={styles.mobileMealCell}>
                <span className={styles.mobileMealLabel}>Обед</span>
                <MealCell
                    value={record.lunch}
                    record={record}
                    mealType="Обед"
                    mealTypeKey="lunch"
                    isMobile={isMobile}
                    onClick={onCellClick}
                />
            </div>
            <div className={styles.mobileMealCell}>
                <span className={styles.mobileMealLabel}>Ужин</span>
                <MealCell
                    value={record.dinner}
                    record={record}
                    mealType="Ужин"
                    mealTypeKey="dinner"
                    isMobile={isMobile}
                    onClick={onCellClick}
                />
            </div>
        </div>
    </Card>
);
