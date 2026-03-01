import React from 'react';
import { Button, Card, Table, Tag } from 'antd';
import dayjs from 'dayjs';

import styles from './group-meal-plan.module.css';
import { useGroupMealPlanData, type MealPlanRowRender } from './useGroupMealPlanData';
import { useGroupMealPlanUI } from './useGroupMealPlanUI';
import { MealPlanEditModal } from './MealPlanEditModal';
import { useScreen } from '../../../shared/providers';
import cn from 'classnames';

const formatMeals = (meals: { amount_meat: number | null; amount_vegan: number | null }, isMobile: boolean = false) => {
    if (meals?.amount_meat === null && meals?.amount_vegan === null) {
        return '-/-';
    }

    const meat = meals?.amount_meat ?? '-';
    const vegan = meals?.amount_vegan ?? '-';

    return isMobile ? `${meat}/${vegan}` : `🥩 ${meat}/${vegan} 🥦`;
};

interface MealCellProps {
    value: { amount_meat: number | null; amount_vegan: number | null };
    record: MealPlanRowRender;
    mealType: string;
    mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
    isMobile: boolean;
    onClick: (params: {
        date: dayjs.Dayjs;
        mealType: string;
        mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
        meals: { amount_meat: number | null; amount_vegan: number | null };
        editable: boolean;
        message?: string;
    }) => void;
}

const MealCell: React.FC<MealCellProps> = ({ value, record, mealType, mealTypeKey, isMobile, onClick }) => {
    if (!record.editable) {
        return <span className={styles.mealCell}>{formatMeals(value, isMobile)}</span>;
    }

    return (
        <Tag
            className={cn(styles.mealCell, styles.editable)}
            bordered={record.editable}
            onClick={() =>
                onClick({
                    date: record.date,
                    mealType,
                    mealTypeKey,
                    meals: value,
                    editable: record.editable,
                    message: record.readonlyMessage
                })
            }
        >
            {formatMeals(value, isMobile)}
        </Tag>
    );
};

const MobileDayCard: React.FC<{
    record: MealPlanRowRender;
    isToday: boolean;
    onCellClick: MealCellProps['onClick'];
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
                    value={record.breakfast || { amount_meat: null, amount_vegan: null }}
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
                    value={record.lunch || { amount_meat: null, amount_vegan: null }}
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
                    value={record.dinner || { amount_meat: null, amount_vegan: null }}
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

export const GroupMealPlan: React.FC = () => {
    const { displayData, showAll, setShowAll, handleSave: saveToData } = useGroupMealPlanData();

    const { isMobile } = useScreen();

    const {
        today,
        modalOpen,
        modalType,
        selectedCell,
        editMeat,
        editVegan,
        handleCellClick,
        handleModalClose,
        handleSave,
        setEditMeat,
        setEditVegan
    } = useGroupMealPlanUI(saveToData);

    const rowClassName = (record: MealPlanRowRender) => {
        return record.date.isSame(today, 'day') ? styles.todayRow : '';
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.header} ${isMobile ? styles.mobileHeader : ''}`}>
                <span className={styles.legend}>
                    <span className={styles.meat}>🥩 Мясоеды</span> / <span className={styles.vegan}>🥦 Веганы</span>
                </span>
                <Button onClick={() => setShowAll(!showAll)} className={styles.showMoreButton}>
                    {showAll ? 'Свернуть' : 'Показать все даты'}
                </Button>
            </div>

            <div className={styles.desktopTable}>
                <Table
                    dataSource={displayData}
                    rowKey="id"
                    pagination={false}
                    className={styles.table}
                    rowClassName={rowClassName}
                >
                    <Table.Column
                        title="Дата"
                        dataIndex="date"
                        key="date"
                        render={(date: dayjs.Dayjs) => (
                            <div className={styles.dateCell}>
                                <span className={styles.dayName}>{date.format('dddd')}</span>
                                <span className={styles.dateValue}>{date.format('DD.MM')}</span>
                            </div>
                        )}
                    />
                    <Table.Column
                        title="Завтрак"
                        dataIndex="breakfast"
                        key="breakfast"
                        render={(
                            value: { amount_meat: number | null; amount_vegan: number | null },
                            record: MealPlanRowRender
                        ) => (
                            <MealCell
                                value={value}
                                record={record}
                                mealType="Завтрак"
                                mealTypeKey="breakfast"
                                isMobile={isMobile}
                                onClick={handleCellClick}
                            />
                        )}
                    />
                    <Table.Column
                        title="Обед"
                        dataIndex="lunch"
                        key="lunch"
                        render={(
                            value: { amount_meat: number | null; amount_vegan: number | null },
                            record: MealPlanRowRender
                        ) => (
                            <MealCell
                                value={value}
                                record={record}
                                mealType="Обед"
                                mealTypeKey="lunch"
                                isMobile={isMobile}
                                onClick={handleCellClick}
                            />
                        )}
                    />
                    <Table.Column
                        title="Ужин"
                        dataIndex="dinner"
                        key="dinner"
                        render={(
                            value: { amount_meat: number | null; amount_vegan: number | null },
                            record: MealPlanRowRender
                        ) => (
                            <MealCell
                                value={value}
                                record={record}
                                mealType="Ужин"
                                mealTypeKey="dinner"
                                isMobile={isMobile}
                                onClick={handleCellClick}
                            />
                        )}
                    />
                </Table>
            </div>

            <div className={styles.mobileList}>
                {displayData.map((record) => (
                    <MobileDayCard
                        key={record.id}
                        record={record}
                        isToday={record.date.isSame(today, 'day')}
                        onCellClick={handleCellClick}
                        isMobile={isMobile}
                    />
                ))}
            </div>

            {modalType === 'edit' && (
                <MealPlanEditModal
                    open={modalOpen}
                    title={`${selectedCell?.mealType || ''}`}
                    dateStr={selectedCell?.dateStr || ''}
                    editMeat={editMeat}
                    editVegan={editVegan}
                    onMeatChange={setEditMeat}
                    onVeganChange={setEditVegan}
                    onSave={handleSave}
                    onCancel={handleModalClose}
                />
            )}
        </div>
    );
};
