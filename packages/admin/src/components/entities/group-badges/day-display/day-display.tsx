import React from 'react';
import type { MealPlanRowRender } from '../useGroupMealPlanData';
import type { PlannedDayCounts } from '../calculatePlannedCountsByDate';
import { Card, Modal, Button } from 'antd';
import styles from './day-display.module.css';
import dayjs from 'dayjs';
import cn from 'classnames';

interface MealValues {
    amount_meat: number | null;
    amount_vegan: number | null;
}

interface DisplayValue {
    label: string;
    isCalculated: boolean;
}

const PLACEHOLDER = '-';

const getDisplayValues = ({
    calculatedCounts,
    value
}: {
    value: MealValues;
    calculatedCounts?: PlannedDayCounts;
}): { meat: DisplayValue; vegan: DisplayValue } => {
    const buildDisplayValue = (explicit: number | null, calculated: number | undefined): DisplayValue => {
        if (explicit !== null) {
            return { label: String(explicit), isCalculated: false };
        }
        if (calculated !== undefined) {
            return { label: String(calculated), isCalculated: true };
        }
        return { label: PLACEHOLDER, isCalculated: false };
    };

    return {
        meat: buildDisplayValue(value?.amount_meat ?? null, calculatedCounts?.meat),
        vegan: buildDisplayValue(value?.amount_vegan ?? null, calculatedCounts?.vegan)
    };
};

const renderMeals = ({
    calculatedCounts,
    isMobile = false,
    value
}: {
    value: MealValues;
    calculatedCounts?: PlannedDayCounts;
    isMobile?: boolean;
}): React.ReactNode => {
    const { meat, vegan } = getDisplayValues({ value, calculatedCounts });

    const meatNode = (
        <span className={cn({ [styles.calculated]: meat.isCalculated })} data-testid="meal-cell-meat">
            {meat.label}
        </span>
    );
    const veganNode = (
        <span className={cn({ [styles.calculated]: vegan.isCalculated })} data-testid="meal-cell-vegan">
            {vegan.label}
        </span>
    );

    if (isMobile) {
        return (
            <>
                {meatNode}/{veganNode}
            </>
        );
    }

    return (
        <>
            🥩 {meatNode}/{veganNode} 🥦
        </>
    );
};

type OnCellClick = (params: {
    date: dayjs.Dayjs;
    mealType: string;
    mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
    meals: MealValues;
    editable: boolean;
    message?: string;
}) => void;

interface MealCellProps {
    value: MealValues;
    record: MealPlanRowRender;
    mealType: string;
    mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
    isMobile: boolean;
    onClick: OnCellClick;
    calculatedCounts?: PlannedDayCounts;
}

export const MealCell: React.FC<MealCellProps> = ({
    calculatedCounts,
    isMobile,
    mealType,
    mealTypeKey,
    onClick,
    record,
    value
}) => {
    const showWarningMessage = record.date.isSame(dayjs(), 'day') && !record.editable;
    const content = renderMeals({ value, calculatedCounts, isMobile });

    if (!record.editable && !showWarningMessage) {
        return <span className={styles.mealCell}>{content}</span>;
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
            {content}
        </Button>
    );
};

interface MobileDayCardProps {
    record: MealPlanRowRender;
    isToday: boolean;
    onCellClick: OnCellClick;
    isMobile: boolean;
    calculatedCounts?: PlannedDayCounts;
}

export const MobileDayCard: React.FC<MobileDayCardProps> = ({
    calculatedCounts,
    isMobile,
    isToday,
    onCellClick,
    record
}) => (
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
                    calculatedCounts={calculatedCounts}
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
                    calculatedCounts={calculatedCounts}
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
                    calculatedCounts={calculatedCounts}
                />
            </div>
        </div>
    </Card>
);
