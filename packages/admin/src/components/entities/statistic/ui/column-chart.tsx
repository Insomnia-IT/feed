import { FC } from 'react';
import { ResponsiveContainer, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ComposedChart, Line } from 'recharts';

import { IColumnChartData } from '../types';

interface IProps {
    data: IColumnChartData[];
}

const ColumnChart: FC<IProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis dataKey="dayLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar dataKey="breakfast_fact" name="Факт: Завтрак" fill="#8884d8" />
                    <Bar dataKey="lunch_fact" name="Факт: Обед" fill="#82ca9d" />
                    <Bar dataKey="dinner_fact" name="Факт: Ужин" fill="#ffc658" />
                    <Bar dataKey="night_fact" name="Факт: Дожор" fill="#ff7f50" />

                    <Line
                        type="monotone"
                        dataKey="plan_total"
                        name="План (суммарно)"
                        stroke="#ff7300"
                        strokeWidth={2}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
export default ColumnChart;
