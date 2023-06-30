import type { ColumnConfig, Options } from '@ant-design/plots';
import dynamic from 'next/dynamic';

import type { MealTime, StatisticType } from '../types';
const Column = dynamic(() => import('@ant-design/plots').then(({ Column }) => Column), { ssr: false });

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

const annotation = {
    type: 'text',
    style: {
        textAlign: 'center' as const,
        fontSize: 14,
        fill: 'rgba(0,0,0,0.85)'
    },
    offsetY: -20
};

function createAnnotation(data: Array<IColumnChartAnnotationData>) {
    const annotations: Options['annotations'] = [];
    data.forEach((datum, index) => {
        annotations.push({
            ...annotation,
            position: [`${(index / data.length) * 100 + 17}%`, '4%'],
            content: `${datum.fact} / ${datum.plan}`
        });
    });
    return annotations;
}

/**Настройки для столбчатого графика*/
const columnConfig: Omit<ColumnConfig, 'data'> = {
    xField: 'date',
    yField: 'value',
    isGroup: true,
    isStack: true,
    seriesField: 'mealTime',
    groupField: 'type',
    padding: 50,
    label: {
        position: 'middle',
        content: (x) => {
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
    tooltip: false,
    // tooltip: {
    //     // customContent: (title, data) => {
    //     //     return `<div>${title}</div>`;
    //     // },
    //     // customItems: (originalItems: TooltipItem[]) => {
    //     //     // process originalItems,
    //     //     console.log(originalItems);
    //     //     return originalItems;
    //     // },
    //     formatter: (datum) => {
    //         return {
    //             name: `${datum.mealTime} ${datum.type === 'plan' ? 'plan' : 'fact'}`,
    //             value: datum.value
    //         };
    //     }
    // },
    interactions: [
        {
            type: 'element-highlight-by-color'
        }
    ]
};

function ColumnChart(props: {
    columnDataArr: Array<IColumnChartData>;
    dataForAnnotation: Array<IColumnChartAnnotationData>;
}) {
    const annotations = createAnnotation(props.dataForAnnotation);
    return <Column data={props.columnDataArr} {...columnConfig} annotations={annotations} />;
}
export { ColumnChart };
export type { IColumnChartData, IColumnChartAnnotationData };
