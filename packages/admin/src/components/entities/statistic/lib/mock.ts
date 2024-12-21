import type { IStatisticResponce } from '../types';

export const mock: IStatisticResponce = [
    {
        date: '2023-05-25',
        type: 'plan',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: '2023-05-25',
        type: 'plan',
        is_vegan: true,
        meal_time: 'breakfast',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: '2023-05-25',
        type: 'fact',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: '2023-05-25',
        type: 'plan',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 10,
        kitchen_id: 0
    },
    {
        date: '2023-05-25',
        type: 'fact',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 1,
        kitchen_id: 0
    },
    {
        date: '2023-05-26',
        type: 'plan',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 2,
        kitchen_id: 0
    },
    {
        date: '2023-05-26',
        type: 'fact',
        is_vegan: false,
        meal_time: 'breakfast',
        amount: 2,
        kitchen_id: 0
    },
    {
        date: '2023-05-26',
        type: 'plan',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 20,
        kitchen_id: 0
    },
    {
        date: '2023-05-26',
        type: 'fact',
        is_vegan: false,
        meal_time: 'dinner',
        amount: 10,
        kitchen_id: 0
    }
];
