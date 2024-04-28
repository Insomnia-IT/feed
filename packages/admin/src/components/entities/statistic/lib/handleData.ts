import type { EaterType, EaterTypeExtended, IData, IEaterTypeAmount, IStatisticResponce, KitchenIdExtended } from '../types';
import { datumInstance, mealTimeArr, dataEmpty } from '../types';
import type { ILinearChartData } from '../ui/linear-chart';
import type { IColumnChartAnnotationData, IColumnChartData } from '../ui/column-chart';
import type { ITableStatData } from '../ui/table-stats';

export function convertResponceToData(res: IStatisticResponce): IData {
    const result: IData = JSON.parse(JSON.stringify(dataEmpty));

    res.forEach((datum) => {
        const { amount, date, is_vegan, kitchen_id, meal_time, type } = datum;
        const eaterType: EaterType = is_vegan ? 'vegan' : 'meatEater';
        const kitchenId: KitchenIdExtended = (kitchen_id == 1) ? 'first' : 'second';

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
export function handleDataForTable(data: IData, date: string, typeOfEater: EaterTypeExtended, kitchenId: KitchenIdExtended): Array<ITableStatData> {
    if (!(date in data)) {
        return [];
    }
    const datum = data[kitchenId][date];
    const plan = { breakfast: 0, lunch: 0, dinner: 0, night: 0, total: 0 };
    const fact = { breakfast: 0, lunch: 0, dinner: 0, night: 0, total: 0 };
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
): { dataForColumnChart: Array<IColumnChartData>; dataForAnnotation: Array<IColumnChartAnnotationData> } {
    const dataForColumnChart: Array<IColumnChartData> = [];
    const dataForAnnotation: Array<IColumnChartAnnotationData> = [];

    if (Object.keys(data).length === 0) {
        return { dataForColumnChart, dataForAnnotation };
    }

    for (const date in data[kitchenId]) {
        for (const mealTime of mealTimeArr) {
            const resPlan = data[kitchenId][date].plan[mealTime];
            const resFact = data[kitchenId][date].fact[mealTime];
            const values = findValuesForTypeEaters(resPlan, resFact, typeOfEater);
            dataForColumnChart.push(
                { date, type: 'fact', mealTime, value: values.fact },
                { date, type: 'plan', mealTime, value: values.plan }
            );
        }
        const resPlan = data[kitchenId][date].plan.total;
        const resFact = data[kitchenId][date].fact.total;
        const values = findValuesForTypeEaters(resPlan, resFact, typeOfEater);
        dataForAnnotation.push({
            date,
            ...values
        });
    }
    return { dataForColumnChart, dataForAnnotation };
}
/**Преобразование данных от сервера для линейного графика*/
export function handleDataForLinearChart(data: IData, typeOfEater: EaterTypeExtended, kitchenId: KitchenIdExtended): Array<ILinearChartData> {
    const result: Array<ILinearChartData> = [];
    if (Object.keys(data).length === 0) {
        return result;
    }

    for (const date in data[kitchenId]) {
        const resPlan = data[kitchenId][date].plan.total;
        const resFact = data[kitchenId][date].fact.total;
        const values = findValuesForTypeEaters(resPlan, resFact, typeOfEater);
        result.push({ type: 'fact', date, value: values.fact }, { type: 'plan', date, value: values.plan });
    }
    return result;
}
