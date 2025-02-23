import { FC, Suspense, lazy } from 'react';
import type { ColumnConfig } from '@ant-design/plots';

import type { MealTime, StatisticType } from '../types';

const Column = lazy(() => import('@ant-design/plots').then(({ Column }) => ({ default: Column })));

/** Данные для столбчатого графика */
interface IColumnChartData {
    date: string;
    type: StatisticType;
    value: number;
    mealTime: MealTime;
}

type IColumnChartAnnotationData = {
    date: string;
    plan: number;
    fact: number;
};

// const annotation = {
//     type: 'text',
//     style: {
//         textAlign: 'center' as const,
//         fontSize: 14,
//         fill: 'rgba(0,0,0,0.85)'
//     },
//     offsetY: -20
// };

// function createAnnotation(data: Array<IColumnChartAnnotationData>) {
//     const annotations: Options['annotations'] = [];
//     data.forEach((datum, index) => {
//         annotations.push({
//             ...annotation,
//             position: [`${(index / data.length) * 100 + 17}%`, '4%'],
//             content: `${datum.fact} / ${datum.plan}`
//         });
//     });
//     return annotations;
// }

/** Настройки для столбчатого графика */
const columnConfig: Omit<ColumnConfig, 'data'> = {
    xField: 'date',
    yField: 'value',
    group: true,
    stack: true,
    seriesField: 'mealTime',
    // groupField: 'type',
    padding: 50,
    label: {
        position: 'top',
        content: (x: { value: string }) => {
            const value = x.value || '';
            return value;
        },
        layout: [
            {
                type: 'adjust-color'
            }
        ]
    },
    legend: {
        position: 'top-left'
    },
    tooltip: false
    // interactions: [
    //     {
    //         type: 'element-highlight-by-color'
    //     }
    // ]
};

const ColumnChart: FC<{
    columnDataArr: Array<IColumnChartData>;
    dataForAnnotation: Array<IColumnChartAnnotationData>;
}> = (props) => {
    //TODO: Разобраться почему не работают аннотации, а лучше использовать другую библиотеку для графиков, потому что говорили, что сейчас визуально не понятно, что происходит на графике
    // const annotations = createAnnotation(props.dataForAnnotation);
    return (
        <Suspense fallback={<div>Loading chart...</div>}>
            <Column data={props.columnDataArr} {...columnConfig} />
        </Suspense>
    );
};

export { ColumnChart };
export type { IColumnChartData, IColumnChartAnnotationData };
