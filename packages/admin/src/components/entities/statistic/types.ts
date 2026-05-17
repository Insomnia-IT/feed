export type StatisticType = 'plan' | 'fact' | 'predict';
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'night' | 'total';
export type StatisticMealTime = Exclude<MealTime, 'total'>;
export const mealTimeArr: Array<MealTime> = ['breakfast', 'lunch', 'dinner', 'night'];

export type EaterType = 'vegan' | 'meatEater';
export type EaterTypeExtended = EaterType | 'all';

export type KitchenId = string;
export type KitchenIdExtended = KitchenId | 'all';
export type BooleanExtended = 'true' | 'false' | 'all';
export type PredictionAlg = '1' | '2' | '3';

export type IEaterTypeAmount = {
    [eaterType in EaterType]: number;
};

export interface IStatisticApi {
    id?: number;
    date: string;
    type: StatisticType;
    is_vegan: boolean | null;
    meal_time: StatisticMealTime;
    amount: number;
    kitchen_id: number | null;
}
export type IStatisticResponse = Array<IStatisticApi>;

export type DataType = {
    [type in StatisticType]: {
        [meal_time in MealTime]: IEaterTypeAmount;
    };
};

export type DataByDate = {
    [date: string]: DataType;
};

export interface IData {
    [kitchenId: string]: DataByDate;
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
    },
    predict: {
        breakfast: { meatEater: 0, vegan: 0 },
        dinner: { meatEater: 0, vegan: 0 },
        lunch: { meatEater: 0, vegan: 0 },
        night: { meatEater: 0, vegan: 0 },
        total: { meatEater: 0, vegan: 0 }
    }
};

export interface IColumnChartData {
    date: string;
    plan: number;
    fact: number;
    predict: number;
}
