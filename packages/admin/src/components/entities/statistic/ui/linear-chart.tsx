import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Brush } from 'recharts';

interface IProps {
    data: {
        date: string;
        plan: number;
        fact: number;
        predict: number;
    }[];
}

const LinearChart = ({ data }: IProps) => {
    return (
        <div style={{ width: '100%', height: 600, marginTop: 40 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="plan" stroke="#222222" name="На поле" />
                    <Line type="monotone" dataKey="fact" stroke="#82ca9d" name="Факт" />
                    <Line type="monotone" dataKey="predict" stroke="#8884d8" name="Прогноз" />
                    <Brush dataKey="date" height={30} stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LinearChart;
