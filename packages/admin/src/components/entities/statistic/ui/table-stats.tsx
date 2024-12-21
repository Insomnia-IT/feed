import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ITableStatData {
    key: string;
    mealTimeType: string;
    plan: number;
    fact: number;
}
const columns: ColumnsType<ITableStatData> = [
    {
        title: 'Прием пищи',
        dataIndex: 'mealTimeType',
        key: 'mealTimeType'
    },
    {
        title: 'План (по количеству людей на поле)',
        dataIndex: 'plan',
        key: 'plan'
    },
    {
        title: 'Факт (количество приемов пищи)',
        dataIndex: 'fact',
        key: 'fact'
    }
];

function TableStats(props: { data: Array<ITableStatData>; loading: boolean }) {
    return (
        <Table
            title={() => <b>Сравнительная таблица по питанию</b>}
            bordered
            size="small"
            pagination={false}
            loading={props.loading}
            columns={columns}
            dataSource={props.data}
        />
    );
}
export default TableStats;
export type { ITableStatData };
