export type StatisticType = 'plan' | 'fact';
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'night' | 'total';
export const mealTimeArr: Array<MealTime> = ['breakfast', 'lunch', 'dinner', 'night'];

export type EaterType = 'vegan' | 'meatEater';
export type EaterTypeExtended = EaterType | 'all';

export type IEaterTypeAmount = {
    [eaterType in EaterType]: number;
};

export interface IStatisticApi {
    date: string;
    type: StatisticType;
    is_vegan: boolean;
    meal_time: MealTime;
    amount: number;
    kitchen_id: number;
}
export type IStatisticResponce = Array<IStatisticApi>;

export type DataType = {
    [type in StatisticType]: {
        [meal_time in MealTime]: IEaterTypeAmount;
    };
};

export interface IData {
    [date: string]: DataType;
}
export const datumInstance: DataType = {
    plan: {
        breakfast: { meatEater: 0, vegan: 0 },
        dinner: { meatEater: 0, vegan: 0 },
        lunch: { meatEater: 0, vegan: 0 },
        night: { meatEater: 0, vegan: 0 },
        total: { meatEater: 0, vegan: 0 }
    },
    fact: {
        breakfast: { meatEater: 0, vegan: 0 },
        dinner: { meatEater: 0, vegan: 0 },
        lunch: { meatEater: 0, vegan: 0 },
        night: { meatEater: 0, vegan: 0 },
        total: { meatEater: 0, vegan: 0 }
    }
};
