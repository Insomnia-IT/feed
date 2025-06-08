import dayjs from 'dayjs';
import type {
    EaterType,
    EaterTypeExtended,
    IColumnChartData,
    IData,
    IEaterTypeAmount,
    IStatisticResponce,
    KitchenId,
    KitchenIdExtended,
    MealTime
} from '../types';
import { dataEmpty, datumInstance, mealTimeArr } from '../types';
import type { ITableStatData } from '../ui/table-stats';

export function convertResponceToData(res: IStatisticResponce): IData {
    const result: IData = JSON.parse(JSON.stringify(dataEmpty));

    res.forEach((datum) => {
        const { amount, date, is_vegan, kitchen_id, meal_time, type } = datum;
        const eaterType: EaterType = is_vegan ? 'vegan' : 'meatEater';
        const kitchenId: KitchenIdExtended = kitchen_id.toString() as KitchenId;

        if (!(date in result[kitchenId])) {
            result[kitchenId][date] = JSON.parse(JSON.stringify(datumInstance));
        }
        if (!(date in result['all'])) {
            result['all'][date] = JSON.parse(JSON.stringify(datumInstance));
        }
        result[kitchenId][date][type][meal_time][eaterType] += amount;
        result[kitchenId][date][type].total[eaterType] += amount;
        result['all'][date][type][meal_time][eaterType] += amount;
        result['all'][date][type].total[eaterType] += amount;
    });
    return result;
}

//Функции для обработки данных
/** Найти в зависимости от типа питания человека план / факт питания. Применяется при поиске для каждого приема пищи (завтра, обед т.д.)*/
function findValuesForTypeEaters(
    resPlan: IEaterTypeAmount,
    resFact: IEaterTypeAmount,
    resPredict: IEaterTypeAmount,
    typeOfEater?: EaterTypeExtended
): { plan: number; fact: number; predict: number } {
    const shallowCopy = { plan: 0, fact: 0, predict: 0 };
    if (typeOfEater === 'meatEater') {
        shallowCopy.plan = resPlan.meatEater;
        shallowCopy.fact = resFact.meatEater;
        shallowCopy.predict = resPredict.meatEater;
    } else if (typeOfEater === 'vegan') {
        shallowCopy.plan = resPlan.vegan;
        shallowCopy.fact = resFact.vegan;
        shallowCopy.predict = resPredict.vegan;
    } else {
        shallowCopy.plan = resPlan.vegan + resPlan.meatEater;
        shallowCopy.fact = resFact.vegan + resFact.meatEater;
        shallowCopy.predict = resPredict.vegan + resPredict.meatEater;
    }
    return shallowCopy;
}

/**Преобразование данных для сравнительной сводной таблицы*/
export function handleDataForTable(
    data: IData,
    date: string,
    typeOfEater: EaterTypeExtended,
    kitchenId: KitchenIdExtended
): Array<ITableStatData> {
    if (!(date in data) && !(date in data.all)) {
        return [];
    }
    const datum = data[kitchenId][date];
    const plan = { breakfast: 0, lunch: 0, dinner: 0, night: 0, total: 0 };
    const fact = { breakfast: 0, lunch: 0, dinner: 0, night: 0, total: 0 };
    const predict = { breakfast: 0, lunch: 0, dinner: 0, night: 0, total: 0 };
    if (datum != undefined) {
        for (const mealTime of mealTimeArr) {
            const resPlan = datum.plan[mealTime];
            const resFact = datum.fact[mealTime];
            const resPredict = datum.predict[mealTime];
            const values = findValuesForTypeEaters(resPlan, resFact, resPredict, typeOfEater);
            plan[mealTime] = values.plan;
            fact[mealTime] = values.fact;
            predict[mealTime] = values.predict;
            // plan.total += values.plan;
            // fact.total += values.fact;
            // predict.total += values.predict;
        }
    }
    return [
        { key: '1', mealTimeType: 'Завтрак', plan: plan.breakfast, fact: fact.breakfast, predict: predict.breakfast },
        { key: '2', mealTimeType: 'Обед', plan: plan.lunch, fact: fact.lunch, predict: predict.lunch },
        { key: '3', mealTimeType: 'Ужин', plan: plan.dinner, fact: fact.dinner, predict: predict.dinner },
        { key: '4', mealTimeType: 'Дожор', plan: plan.night, fact: fact.night, predict: predict.night }
        // { key: '5', mealTimeType: 'Всего', plan: plan.total, fact: fact.total, predict: predict.total }
    ];
}

/**Преобразование данных от сервера для столбчатого графика*/
export function handleDataForColumnChart(
    data: IData,
    typeOfEater: EaterTypeExtended,
    kitchenId: KitchenIdExtended,
    mealTime: MealTime
): Array<IColumnChartData> {
    const result: IColumnChartData[] = [];

    if (!data || Object.keys(data).length === 0) {
        return result;
    }

    const dayData = data[kitchenId];
    if (!dayData) {
        return result;
    }

    const dates = Object.keys(dayData).sort((a, b) => dayjs(a).diff(dayjs(b)));

    for (const date of dates) {
        const row: IColumnChartData = {
            date,
            plan: 0,
            fact: 0,
            predict: 0
        };

        const oneDay = dayData[date];
        if (!oneDay) {
            result.push(row);
            continue;
        }

        const resPlan = oneDay.plan[mealTime];
        const resFact = oneDay.fact[mealTime];
        const resPredict = oneDay.predict[mealTime];
        const { plan, fact, predict } = findValuesForTypeEaters(resPlan, resFact, resPredict, typeOfEater);

        row.plan = plan;
        row.fact = fact;
        row.predict = predict;

        result.push(row);
    }

    return result;
}

/**Преобразование данных от сервера для линейного графика*/
export function handleDataForLinearChart(
    data: IData,
    typeOfEater: EaterTypeExtended,
    kitchenId: KitchenIdExtended,
    mealTime: MealTime
): Array<{ date: string; plan: number; fact: number; predict: number }> {
    const result: Array<{ date: string; plan: number; fact: number; predict: number }> = [];

    if (Object.keys(data).length === 0) {
        return result;
    }

    for (const date in data[kitchenId]) {
        const resPlan = data[kitchenId][date].plan[mealTime];
        const resFact = data[kitchenId][date].fact[mealTime];
        const resPredict = data[kitchenId][date].predict[mealTime];
        const { plan, fact, predict } = findValuesForTypeEaters(resPlan, resFact, resPredict, typeOfEater);

        result.push({
            date,
            plan,
            fact,
            predict
        });
    }

    return result;
}
