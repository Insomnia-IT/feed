import { dayjsExtended as dayjsExt } from '~/shared/lib';

import type { IStatisticResponce } from '../types';

export const mock: IStatisticResponce = [
    {
        date: dayjsExt('2023-05-25').unix(),
        type: 'plan',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-25').unix(),
        type: 'plan',
        is_vegan: true,
        meal_time: 'breakfast',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-25').unix(),
        type: 'fact',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-25').unix(),
        type: 'plan',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 10,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-25').unix(),
        type: 'fact',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-26').unix(),
        type: 'plan',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 2,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-26').unix(),
        type: 'fact',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 2,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-26').unix(),
        type: 'plan',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 20,
        kitchen_id: 0
    },
    {
        date: dayjsExt('2023-05-26').unix(),
        type: 'fact',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 10,
        kitchen_id: 0
    }
];
