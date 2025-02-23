import { FC } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Brush } from 'recharts';

interface IProps {
    data: {
        date: string;
        plan: number;
        fact: number;
    }[];
}

const LinearChart: FC<IProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 600, marginTop: 40 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="plan" stroke="#8884d8" name="План" />
                    <Line type="monotone" dataKey="fact" stroke="#82ca9d" name="Факт" />
                    <Brush dataKey="date" height={30} stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LinearChart;
