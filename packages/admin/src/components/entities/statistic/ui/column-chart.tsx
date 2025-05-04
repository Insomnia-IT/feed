import { FC, useMemo } from 'react';
import { ResponsiveContainer, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart } from 'recharts';
import { Spin } from 'antd';

import { IColumnChartData, MealTime } from '../types';

interface IProps {
    data: IColumnChartData[];
    mealTime: MealTime;
    loading?: boolean;
}

const ColumnChartByMealTime: FC<IProps> = ({ data, mealTime, loading }) => {
    const chartData = useMemo(() => {
        return data.map((item) => {
            return {
                date: item.date,
                plan: (item as any)[`${mealTime}_plan`] || 0,
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

                    <Bar dataKey="plan" name="План" fill="#8884d8" />
                    <Bar dataKey="fact" name="Факт" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ColumnChartByMealTime;
