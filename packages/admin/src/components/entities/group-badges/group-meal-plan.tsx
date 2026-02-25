import React from 'react';
import { Button, Table, Tag } from 'antd';
import dayjs from 'dayjs';

import styles from './group-meal-plan.module.css';
import { useGroupMealPlanData, type MealPlanRowRender } from './useGroupMealPlanData';
import { useGroupMealPlanUI } from './useGroupMealPlanUI';
import { MealPlanEditModal } from './MealPlanEditModal';
import { MealPlanReadonlyModal } from './MealPlanReadonlyModal';

const formatMeals = (meals: { amount_meat: number | null; amount_vegan: number | null }) => {
    if (meals.amount_meat === null && meals.amount_vegan === null) {
        return '-/-';
    }
    const meat = meals.amount_meat ?? '-';
    const vegan = meals.amount_vegan ?? '-';
    return `🥩 ${meat}/${vegan} 🥦`;
};

export const GroupMealPlan: React.FC = () => {
    const { displayData, showAll, setShowAll, handleSave: saveToData } = useGroupMealPlanData();

    const {
        today,
        modalOpen,
        modalType,
        selectedCell,
        editMeat,
        editVegan,
        readonlyMessage,
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
            <div>
                <span className={styles.meat}>🥩 Мясоеды</span> / <span className={styles.vegan}>🥦 Веганы</span>
                <Button onClick={() => setShowAll(!showAll)} className={styles.showMoreButton}>
                    {showAll ? 'Свернуть' : 'Показать все даты'}
                </Button>
            </div>

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
                        <Tag
                            className={styles.mealCell}
                            onClick={() =>
                                handleCellClick(
                                    record.date,
                                    'Завтрак',
                                    'breakfast',
                                    value,
                                    record.editable,
                                    record.readonlyMessage
                                )
                            }
                        >
                            {formatMeals(value)}
                        </Tag>
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
                        <Tag
                            className={styles.mealCell}
                            onClick={() =>
                                handleCellClick(
                                    record.date,
                                    'Обед',
                                    'lunch',
                                    value,
                                    record.editable,
                                    record.readonlyMessage
                                )
                            }
                        >
                            {formatMeals(value)}
                        </Tag>
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
                        <Tag
                            className={styles.mealCell}
                            onClick={() =>
                                handleCellClick(
                                    record.date,
                                    'Ужин',
                                    'dinner',
                                    value,
                                    record.editable,
                                    record.readonlyMessage
                                )
                            }
                        >
                            {formatMeals(value)}
                        </Tag>
                    )}
                />
            </Table>

            {modalType === 'edit' && (
                <MealPlanEditModal
                    open={modalOpen}
                    title={`Редактирование: ${selectedCell?.mealType || ''}`}
                    dateStr={selectedCell?.dateStr || ''}
                    editMeat={editMeat}
                    editVegan={editVegan}
                    onMeatChange={setEditMeat}
                    onVeganChange={setEditVegan}
                    onSave={handleSave}
                    onCancel={handleModalClose}
                />
            )}

            {modalType === 'readonly' && (
                <MealPlanReadonlyModal
                    open={modalOpen}
                    title={`Просмотр: ${selectedCell?.mealType || ''}`}
                    dateStr={selectedCell?.dateStr || ''}
                    message={readonlyMessage}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};
