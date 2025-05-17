import { FC, useMemo } from 'react';
import { ResponsiveContainer, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart } from 'recharts';
import { Spin } from 'antd';

import { IColumnChartData, MealTime } from '../types';

interface IProps {
    data: IColumnChartData[];
    mealTime: MealTime;
    loading?: boolean;
}

const labelProps = { stroke: '#333' };

const ColumnChartByMealTime: FC<IProps> = ({ data, mealTime, loading }) => {
    const chartData = useMemo(() => {
        return data.map((item) => {
            return {
                date: item.date,
                predict: (item as any)[`${mealTime}_predict`] || 0,
                fact: (item as any)[`${mealTime}_fact`] || 0
            };
        });
    }, [data, mealTime]);

    if (loading) {
        return <Spin />;
    }

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar dataKey="fact" name="Факт" fill="#82ca9d" label={labelProps} />
                    <Bar dataKey="predict" name="Прогноз" fill="#8884d8" label={labelProps} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ColumnChartByMealTime;
