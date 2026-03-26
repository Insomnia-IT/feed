import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

import type { ApiHook } from '~/request/lib';
import type { GroupBadge, MealPlanCell } from '~/db';
import { db } from '~/db';

type MealTime = 'breakfast' | 'lunch' | 'dinner';

const fillMissingTodayCells = (results: Array<GroupBadge>): Array<GroupBadge> => {
    const today = dayjs().format('YYYY-MM-DD');
    const mealTimes: Array<MealTime> = ['breakfast', 'lunch', 'dinner'];

    return results.map((groupBadge) => {
        const cells = [...groupBadge.planning_cells];
        const todayCells = cells.filter((cell) => cell.date === today);

        const newCells: Array<MealPlanCell> = [];

        for (const mealTime of mealTimes) {
            const todayCell = todayCells.find((cell) => cell.meal_time === mealTime);

            if (todayCell) {
                continue;
            }

            const previousCells = cells
                .filter((cell) => cell.date < today && cell.meal_time === mealTime)
                .sort((a, b) => b.date.localeCompare(a.date));

            const previousCell = previousCells[0];

            if (previousCell) {
                newCells.push({
                    group_badge: groupBadge.id,
                    group_badge_name: groupBadge.name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    date: today,
                    meal_time: mealTime,
                    amount_meat: previousCell.amount_meat,
                    amount_vegan: previousCell.amount_vegan
                });
            }
        }

        if (newCells.length > 0) {
            return {
                ...groupBadge,
                planning_cells: [...cells, ...newCells]
            };
        }

        return groupBadge;
    });
};

export const useGetGroupBadges = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(
        (filters) => {
            if (fetching) {
                return Promise.resolve(false);
            }

            setFetching(true);

            return new Promise((res, rej) => {
                axios
                    .get<{ results: Array<GroupBadge> }>(`${baseUrl}/group-badges/`, {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        },
                        params: filters
                    })
                    .then(async ({ data: { results } }) => {
                        setFetching(false);

                        try {
                            results = fillMissingTodayCells(results);
                            await db.groupBadges.bulkPut(results);
                        } catch (error) {
                            console.error(error);
                            rej(error);

                            return false;
                        }

                        setUpdated(+new Date());
                        res(true);

                        return true;
                    })
                    .catch((error) => {
                        setFetching(false);

                        if (error?.response?.status === 401) {
                            rej(false);
                            setAuth(false);

                            return false;
                        }

                        setError(error);
                        rej(error);

                        return error;
                    });
            });
        },
        [baseUrl, error, fetching, pin, setAuth]
    );

    return <ApiHook>useMemo(
        () => ({
            fetching,
            error,
            updated,
            send
        }),
        [error, fetching, send, updated]
    );
};
