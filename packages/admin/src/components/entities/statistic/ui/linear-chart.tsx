import { FC, Suspense, lazy } from 'react';
import type { LineConfig } from '@ant-design/plots';

import type { StatisticType } from '../types';

/** Данные для линейного графика */
interface ILinearChartData {
    date: string;
    value: number;
    type: StatisticType;
}

/** Настройки для линейчатого графика */
const lineConfig: LineConfig = {
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    meta: {
        value: {
            alias: 'Значение',
            tickInterval: 5
        }
    }
};

const Line = lazy(() => import('@ant-design/plots').then((module) => ({ default: module.Line })));

const LinearChart: FC<{ linearChartData: Array<ILinearChartData> }> = (props) => {
    return (
        <Suspense fallback={<div>Loading chart...</div>}>
            <Line data={props.linearChartData} {...lineConfig} />
        </Suspense>
    );
};

export default LinearChart;
export type { ILinearChartData };
