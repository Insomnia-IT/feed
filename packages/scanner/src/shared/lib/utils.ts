import { MealTime } from 'db';

export const rndInt = (min: number, max: number): number => min + Math.round(Math.random() * (max - min));

export const mealTimes: Record<MealTime, string> = {
    [MealTime.breakfast]: 'Завтрак',
    [MealTime.lunch]: 'Обед',
    [MealTime.dinner]: 'Ужин',
    [MealTime.night]: 'Дожор'
};

export const getMealTimeText = (mealTime?: MealTime | null): string => {
    return mealTime ? mealTimes[mealTime] || '' : '';
};

export const getPlural = (number: number, titles: Array<string>): string => {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]];
};

export const removeNonDigits = (value: string): string => value.replace(/\D/, '');
