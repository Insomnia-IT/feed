import React from 'react';
import { Button, Table } from 'antd';
import dayjs from 'dayjs';

import styles from './group-meal-plan.module.css';
import { type MealPlanRowRender, useGroupMealPlanData } from '../useGroupMealPlanData';
import { useGroupMealPlanUI } from '../useGroupMealPlanUI';
import {
    getPlannedCountsForDate,
    type PlannedCountsByDate,
    type PlannedDayCounts
} from '../calculatePlannedCountsByDate';
import { useGroupBadgeVolunteerCounts } from '../useGroupBadgeVolunteerCounts';
import { MealPlanEditModal } from '../meal-plan-edit-modal/meal-plan-edit-modal';
import { useScreen } from 'shared/providers';
import type { BaseKey } from '@refinedev/core';
import { MealCell, MobileDayCard } from '../day-display/day-display';

type MealValues = { amount_meat: number | null; amount_vegan: number | null };

const getCalculatedCountsForRow = ({
    countsByDate,
    date
}: {
    countsByDate: PlannedCountsByDate;
    date: dayjs.Dayjs;
}): PlannedDayCounts => getPlannedCountsForDate(countsByDate, date.format('YYYY-MM-DD'));

export const GroupMealPlan: React.FC<{ id?: BaseKey }> = ({ id }) => {
    const { displayData, handleSave: saveToData, setShowAll, showAll } = useGroupMealPlanData({ id });
    const { countsByDate } = useGroupBadgeVolunteerCounts({ id });

    const { isMobile } = useScreen();

    const {
        editMeat,
        editVegan,
        handleCellClick,
        handleModalClose,
        handleSave,
        modalOpen,
        modalType,
        selectedCell,
        setEditMeat,
        setEditVegan,
        today
    } = useGroupMealPlanUI(saveToData);

    const rowClassName = (record: MealPlanRowRender) => {
        return record.date.isSame(today, 'day') ? styles.todayRow : '';
    };

    return (
        <>
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
                        render={(value: MealValues, record: MealPlanRowRender) => (
                            <MealCell
                                value={value}
                                record={record}
                                mealType="Завтрак"
                                mealTypeKey="breakfast"
                                isMobile={isMobile}
                                onClick={handleCellClick}
                                calculatedCounts={getCalculatedCountsForRow({
                                    countsByDate,
                                    date: record.date
                                })}
                            />
                        )}
                    />
                    <Table.Column
                        title="Обед"
                        dataIndex="lunch"
                        key="lunch"
                        render={(value: MealValues, record: MealPlanRowRender) => (
                            <MealCell
                                value={value}
                                record={record}
                                mealType="Обед"
                                mealTypeKey="lunch"
                                isMobile={isMobile}
                                onClick={handleCellClick}
                                calculatedCounts={getCalculatedCountsForRow({
                                    countsByDate,
                                    date: record.date
                                })}
                            />
                        )}
                    />
                    <Table.Column
                        title="Ужин"
                        dataIndex="dinner"
                        key="dinner"
                        render={(value: MealValues, record: MealPlanRowRender) => (
                            <MealCell
                                value={value}
                                record={record}
                                mealType="Ужин"
                                mealTypeKey="dinner"
                                isMobile={isMobile}
                                onClick={handleCellClick}
                                calculatedCounts={getCalculatedCountsForRow({
                                    countsByDate,
                                    date: record.date
                                })}
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
                        calculatedCounts={getCalculatedCountsForRow({
                            countsByDate,
                            date: record.date
                        })}
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
        </>
    );
};
