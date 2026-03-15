import { FC, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Checkbox, Space, Spin, Table, Typography } from 'antd';
import { useDataProvider, useInvalidate, useNotification, useOne } from '@refinedev/core';

import { MEAL_MAP } from 'const';
import type { GroupBadgeEntity, GroupBadgePlanningCellEntity, MealType } from 'interfaces';

const { Text, Title } = Typography;

type PlanningMealType = Exclude<MealType, 'night'>;

const PLANNING_MEALS: PlanningMealType[] = ['breakfast', 'lunch', 'dinner'];

const getTomorrowDate = () => dayjs().add(1, 'day').format('YYYY-MM-DD');
const getMillisecondsUntilNextDay = () => dayjs().startOf('day').add(1, 'day').diff(dayjs()) + 1000;

const isPlanningMeal = (meal: MealType): meal is PlanningMealType => PLANNING_MEALS.includes(meal as PlanningMealType);

const isDisabledMealCell = (cell?: GroupBadgePlanningCellEntity) => cell?.amount_meat === 0 && cell?.amount_vegan === 0;

const formatCellValue = (cell?: GroupBadgePlanningCellEntity) => {
    if (!cell || (cell.amount_meat === null && cell.amount_vegan === null)) {
        return '-/-';
    }

    return `${cell.amount_meat ?? '-'}/${cell.amount_vegan ?? '-'}`;
};

export const GroupBadgePlanning: FC<{ groupBadgeId: number }> = ({ groupBadgeId }) => {
    const dataProvider = useDataProvider();
    const invalidate = useInvalidate();
    const { open = () => {} } = useNotification();
    const [savingMeal, setSavingMeal] = useState<PlanningMealType | null>(null);
    const [tomorrowDate, setTomorrowDate] = useState(getTomorrowDate);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setTomorrowDate(getTomorrowDate());
        }, getMillisecondsUntilNextDay());

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [tomorrowDate]);

    const { data, isLoading } = useOne<GroupBadgeEntity>({
        resource: 'group-badges',
        id: groupBadgeId
    });

    const tomorrowCellsByMeal = useMemo(() => {
        const result = new Map<PlanningMealType, GroupBadgePlanningCellEntity>();

        (data?.data?.planning_cells ?? []).forEach((cell) => {
            if (cell.date === tomorrowDate && isPlanningMeal(cell.meal_time)) {
                result.set(cell.meal_time, cell);
            }
        });

        return result;
    }, [data?.data?.planning_cells, tomorrowDate]);

    const isMealEnabled = (meal: PlanningMealType) => !isDisabledMealCell(tomorrowCellsByMeal.get(meal));

    const tableData = PLANNING_MEALS.map((meal) => ({
        key: meal,
        meal,
        value: formatCellValue(tomorrowCellsByMeal.get(meal))
    }));

    const updatePlanningCell = async (meal: PlanningMealType, nextChecked: boolean) => {
        const cell = tomorrowCellsByMeal.get(meal);
        const mutationVariables = nextChecked
            ? {
                  amount_meat: null,
                  amount_vegan: null
              }
            : {
                  amount_meat: 0,
                  amount_vegan: 0
              };

        try {
            setSavingMeal(meal);

            if (cell?.id) {
                await dataProvider().update<GroupBadgePlanningCellEntity>({
                    resource: 'group-badge-planning-cells',
                    id: cell.id,
                    variables: mutationVariables
                });
            } else if (!nextChecked) {
                await dataProvider().create<GroupBadgePlanningCellEntity>({
                    resource: 'group-badge-planning-cells',
                    variables: {
                        group_badge: groupBadgeId,
                        meal_time: meal,
                        date: tomorrowDate,
                        ...mutationVariables
                    }
                });
            }

            await invalidate({
                resource: 'group-badges',
                invalidates: ['detail', 'list'],
                id: groupBadgeId
            });

            open({
                type: 'success',
                message: 'Планирование обновлено'
            });
        } catch {
            open({
                type: 'error',
                message: 'Не удалось обновить планирование'
            });
        } finally {
            setSavingMeal(null);
        }
    };

    if (isLoading) {
        return <Spin />;
    }

    return (
        <div style={{ marginBottom: 24 }}>
            <Title level={5}>Планирование питания</Title>
            <Text type="secondary">Завтрашняя дата: {dayjs(tomorrowDate).format('DD.MM.YYYY')}</Text>

            <Space wrap size="large" style={{ display: 'flex', marginTop: 16, marginBottom: 16 }}>
                {PLANNING_MEALS.map((meal) => (
                    <Checkbox
                        key={meal}
                        checked={isMealEnabled(meal)}
                        disabled={savingMeal !== null}
                        onChange={(event) => void updatePlanningCell(meal, event.target.checked)}
                    >
                        {MEAL_MAP[meal]}
                    </Checkbox>
                ))}
            </Space>

            <Table
                rowKey="key"
                size="small"
                pagination={false}
                dataSource={tableData}
                columns={[
                    {
                        title: 'Прием пищи',
                        dataIndex: 'meal',
                        key: 'meal',
                        render: (value: PlanningMealType) => MEAL_MAP[value]
                    },
                    {
                        title: dayjs(tomorrowDate).format('DD.MM.YYYY'),
                        dataIndex: 'value',
                        key: 'value'
                    }
                ]}
            />
        </div>
    );
};
