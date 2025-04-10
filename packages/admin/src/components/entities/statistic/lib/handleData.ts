import dayjs from 'dayjs';
import type {
    EaterType,
    EaterTypeExtended,
    IColumnChartData,
    IData,
    IEaterTypeAmount,
    IStatisticResponce,
    KitchenIdExtended
} from '../types';
import { dataEmpty, datumInstance, mealTimeArr } from '../types';
import type { ITableStatData } from '../ui/table-stats';

export function convertResponceToData(res: IStatisticResponce): IData {
    const result: IData = JSON.parse(JSON.stringify(dataEmpty));

    res.forEach((datum) => {
        const { amount, date, is_vegan, kitchen_id, meal_time, type } = datum;
        const eaterType: EaterType = is_vegan ? 'vegan' : 'meatEater';
        const kitchenId: KitchenIdExtended = kitchen_id == 1 ? 'first' : 'second';

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
    typeOfEater?: EaterTypeExtended
): { plan: number; fact: number } {
    const shallowCopy = { plan: 0, fact: 0 };
    if (typeOfEater === 'meatEater') {
        shallowCopy.plan = resPlan.meatEater;
        shallowCopy.fact = resFact.meatEater;
    } else if (typeOfEater === 'vegan') {
        shallowCopy.plan = resPlan.vegan;
        shallowCopy.fact = resFact.vegan;
    } else {
        shallowCopy.plan = resPlan.vegan + resPlan.meatEater;
        shallowCopy.fact = resFact.vegan + resFact.meatEater;
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
    if (datum != undefined)
        for (const mealTime of mealTimeArr) {
            const resPlan = datum.plan[mealTime];
            const resFact = datum.fact[mealTime];
            const values = findValuesForTypeEaters(resPlan, resFact, typeOfEater);
            plan[mealTime] = values.plan;
            fact[mealTime] = values.fact;
            plan.total += values.plan;
            fact.total += values.fact;
        }
    return [
        { key: '1', mealTimeType: 'Завтрак', plan: plan.breakfast, fact: fact.breakfast },
        { key: '2', mealTimeType: 'Обед', plan: plan.lunch, fact: fact.lunch },
        { key: '3', mealTimeType: 'Ужин', plan: plan.dinner, fact: fact.dinner },
        { key: '4', mealTimeType: 'Дожор', plan: plan.night, fact: fact.night },
        { key: '5', mealTimeType: 'Всего', plan: plan.total, fact: fact.total }
    ];
}

/**Преобразование данных от сервера для столбчатого графика*/
export function handleDataForColumnChart(
    data: IData,
    typeOfEater: EaterTypeExtended,
    kitchenId: KitchenIdExtended
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
            breakfast_plan: 0,
            breakfast_fact: 0,
            lunch_plan: 0,
            lunch_fact: 0,
            dinner_plan: 0,
            dinner_fact: 0,
            night_plan: 0,
            night_fact: 0,
            plan_total: 0,
            fact_total: 0
        };

        const oneDay = dayData[date];
        if (!oneDay) {
            result.push(row);
            continue;
        }

        for (const mealTime of mealTimeArr) {
            const resPlan = oneDay.plan[mealTime];
            const resFact = oneDay.fact[mealTime];
            const { plan, fact } = findValuesForTypeEaters(resPlan, resFact, typeOfEater);

            (row as any)[`${mealTime}_plan`] = plan;
            (row as any)[`${mealTime}_fact`] = fact;
        }

        row.plan_total = row.breakfast_plan + row.lunch_plan + row.dinner_plan + row.night_plan;

        row.fact_total = row.breakfast_fact + row.lunch_fact + row.dinner_fact + row.night_fact;

        result.push(row);
    }

    return result;
}

/**Преобразование данных от сервера для линейного графика*/
export function handleDataForLinearChart(
    data: IData,
    typeOfEater: EaterTypeExtended,
    kitchenId: KitchenIdExtended
): Array<{ date: string; plan: number; fact: number }> {
    const result: Array<{ date: string; plan: number; fact: number }> = [];

    if (Object.keys(data).length === 0) {
        return result;
    }

    for (const date in data[kitchenId]) {
        const resPlan = data[kitchenId][date].plan.total;
        const resFact = data[kitchenId][date].fact.total;
        const { plan, fact } = findValuesForTypeEaters(resPlan, resFact, typeOfEater);

        result.push({
            date,
            plan,
            fact
        });
    }

    return result;
}
