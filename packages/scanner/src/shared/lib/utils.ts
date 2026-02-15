import { MealTime } from 'db';

export const rndInt = (min: number, max: number): number => min + Math.round(Math.random() * (max - min));

export const nop: () => void = () => {};

export const sliceIntoChunks = <T>(arr: Array<T>, chunkSize: number): Array<Array<T>> => {
    const res: Array<Array<T>> = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
};

export const clearCache = (): void => {
    // db.delete();
    if ('serviceWorker' in navigator) {
        void caches.keys().then(function (cacheNames) {
            cacheNames.forEach(function (cacheName) {
                void caches.delete(cacheName);
            });
        });
    }
    window.location.reload();
};

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
