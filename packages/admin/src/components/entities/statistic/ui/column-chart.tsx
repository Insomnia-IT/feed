import { useMemo } from 'react';
import {
    ResponsiveContainer,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Line,
    ComposedChart,
    type LabelListProps
} from 'recharts';
import { Spin } from 'antd';

import type { IColumnChartData, MealTime } from '../types';

interface IProps {
    data: IColumnChartData[];
    mealTime: MealTime;
    loading?: boolean;
}

const labelProps: LabelListProps = { position: 'top', fill: '#333' };

const ColumnChartByMealTime = ({ data, loading }: IProps) => {
    const chartData = useMemo(() => {
        return data.map((item) => {
            return {
                date: item.date,
                plan: item.plan || 0,
                predict: item.predict || 0,
                fact: item.fact || 0
            };
        });
    }, [data]);

    if (loading) {
        return <Spin />;
    }

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar dataKey="fact" name="Факт" fill="#82ca9d" label={labelProps} />
                    <Bar dataKey="predict" name="Прогноз" fill="#8884d8" label={labelProps} />
                    <Line type="monotone" dataKey="plan" stroke="#222222" name="На поле" label={labelProps} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ColumnChartByMealTime;
