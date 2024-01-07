import { MealTime } from '~/db';

export const rndInt = (min: number, max: number): number => min + Math.round(Math.random() * (max - min));

// eslint-disable-next-line @typescript-eslint/no-empty-function
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

const mealTimes = {
    [MealTime.breakfast]: 'Завтрак',
    [MealTime.lunch]: 'Обед',
    [MealTime.dinner]: 'Ужин',
    [MealTime.night]: 'Дожор'
};

export const getMealTimeText = (mealTime: string): string => {
    return mealTimes[mealTime] || '';
};

/*** Функция для генерации строки query params из плоского объекта */
export const queryParamsFromObject = (objParams: any): string | null => {
    return typeof objParams === 'object'
        ? Object.entries(objParams).reduce((acc, curr, index) => {
              if (index > 0) {
                  acc = acc + '&';
              }
              return acc + `${curr[0]}=${curr[1]}`;
          }, '?')
        : null;
};
