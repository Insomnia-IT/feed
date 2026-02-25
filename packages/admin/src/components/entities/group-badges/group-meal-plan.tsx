import React from 'react';
import { Button, InputNumber, Modal, Table, Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import styles from './group-meal-plan.module.css';
import { useGroupMealPlanData, type MealPlanRowRender } from './useGroupMealPlanData';
import { useGroupMealPlanUI } from './useGroupMealPlanUI';

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
        selectedCell,
        editMeat,
        editaVegan,
        handleCellClick,
        handleModalClose,
        handleSave,
        setEditMeat,
        setEditaVegan
    } = useGroupMealPlanUI(saveToData);

    const isValid = (editMeat !== null && editMeat < 0) || (editaVegan !== null && editaVegan < 0);

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
                            onClick={() => handleCellClick(record.date, 'Завтрак', 'breakfast', value)}
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
                            onClick={() => handleCellClick(record.date, 'Обед', 'lunch', value)}
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
                            onClick={() => handleCellClick(record.date, 'Ужин', 'dinner', value)}
                        >
                            {formatMeals(value)}
                        </Tag>
                    )}
                />
            </Table>

            <Modal
                title={`Редактирование: ${selectedCell?.mealType || ''} - ${selectedCell?.dateStr || ''}`}
                open={modalOpen}
                onCancel={handleModalClose}
                footer={null}
                width={400}
            >
                <div className={styles.modalContent}>
                    <div className={styles.inputRow}>
                        <label className={styles.meat}>🥩 Мясоеды:</label>
                        <InputNumber
                            value={editMeat}
                            onChange={(v) => setEditMeat(v)}
                            addonAfter={
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => setEditMeat(null)}
                                />
                            }
                        />
                    </div>
                    <div className={styles.inputRow}>
                        <label className={styles.vegan}>🥦 Веганы:</label>
                        <InputNumber
                            value={editaVegan}
                            onChange={(v) => setEditaVegan(v)}
                            addonAfter={
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => setEditaVegan(null)}
                                />
                            }
                        />
                    </div>
                    <div className={styles.modalButtons}>
                        <Button onClick={handleModalClose}>Отмена</Button>
                        <Button type="primary" onClick={handleSave} disabled={isValid}>
                            Сохранить
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
