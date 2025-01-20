import { FC } from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import { IColumnChartData } from '../types';

interface IProps {
    data: IColumnChartData[];
}

const ColumnChart: FC<IProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={data} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    {/* Завтрак */}
                    <Bar dataKey="breakfast_plan" fill="#8884d8" name="План: Завтрак" />
                    <Bar dataKey="breakfast_fact" fill="#82ca9d" name="Факт: Завтрак" />

                    {/* Обед */}
                    <Bar dataKey="lunch_plan" fill="#8884d8" name="План: Обед" />
                    <Bar dataKey="lunch_fact" fill="#82ca9d" name="Факт: Обед" />

                    {/* Ужин */}
                    <Bar dataKey="dinner_plan" fill="#8884d8" name="План: Ужин" />
                    <Bar dataKey="dinner_fact" fill="#82ca9d" name="Факт: Ужин" />

                    {/* Дожор/Ночной прием */}
                    <Bar dataKey="night_plan" fill="#8884d8" name="План: Дожор" />
                    <Bar dataKey="night_fact" fill="#82ca9d" name="Факт: Дожор" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ColumnChart;
