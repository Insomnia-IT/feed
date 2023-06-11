import { DateField, DeleteButton, List, Space, Table, TextField, useTable } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';
import { useMemo } from 'react';
import { Button, Form, Input } from 'antd';
import axios from 'axios';

import { saveXLSX } from '~/shared/lib/saveXLSX';
import type { FeedTransactionEntity, KitchenEntity, VolEntity } from '~/interfaces';

const ExcelJS = require('exceljs');

const mealTimeById = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const FeedTransactionList: FC<IResourceComponentsProps> = () => {
    const { searchFormProps, tableProps } = useTable<FeedTransactionEntity>({
        onSearch: (values) => {
            return [
                {
                    field: 'search',
                    value: values.search
                }
            ];
        }
    });

    const { data: vols } = useList<VolEntity>({
        resource: 'volunteers'
    });
    const { data: kitchens } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const volNameById = useMemo(() => {
        return (vols ? vols.data : []).reduce(
            (acc, vol) => ({
                ...acc,
                [vol.id]: vol.nickname
            }),
            {}
        );
    }, [vols]);

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {}
        );
    }, [kitchens]);

    const createAndSaveXLSX = async (): Promise<void> => {
        const { data } = await axios.get('http://localhost:4000/feedapi/v1/feed-transaction/?limit=10000');
        const transactions = data.results as Array<FeedTransactionEntity>;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Transactions log');

        const header = ['Время', 'Волонтер', 'Бейдж', 'Веган', 'Прием пищи', 'Кухня', 'Кол-во', 'Причина'];
        sheet.addRow(header);

        transactions.forEach((tx) => {
            sheet.addRow([
                tx.dtime,
                tx.volunteer ? volNameById[tx.volunteer] : 'Аноним',
                tx.qr_code,
                tx.is_vegan ? 'Да' : 'Нет',
                tx.meal_time,
                kitchenNameById[tx.kitchen],
                tx.amount,
                tx.reason
            ]);
        });
        void saveXLSX(workbook, 'feed-transactions');
    };

    const Footer = (): JSX.Element => {
        return (
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            <Button onClick={() => createAndSaveXLSX()} disabled={!tableProps.dataSource}>
                Выгрузить
            </Button>
        );
    };

    return (
        <List>
            <Form {...searchFormProps}>
                <Space align={'start'}>
                    <Form.Item name='search'>
                        <Input placeholder='Имя волонтера, код бэйджа' allowClear />
                    </Form.Item>
                    <Button onClick={searchFormProps.form?.submit}>Применить</Button>
                </Space>
            </Form>
            <Table {...tableProps} rowKey='ulid' footer={Footer}>
                <Table.Column
                    dataIndex='dtime'
                    key='dtime'
                    title='Время'
                    render={(value) => value && <DateField format='DD/MM/YY HH:mm:ss' value={value} />}
                />
                <Table.Column
                    dataIndex='volunteer'
                    title='Волонтер'
                    render={(value) => <TextField value={value ? volNameById[value] : 'Аноним'} />}
                />
                <Table.Column dataIndex='qr_code' title='Бейдж' render={(value) => <TextField value={value ?? ''} />} />
                <Table.Column
                    dataIndex='is_vegan'
                    title='Веган'
                    render={(value) => <TextField value={value ? 'Да' : 'Нет'} />}
                    // filterDropdown={(props) => (
                    //     <FilterDropdown {...props}>
                    //         <Select style={selectStyle} placeholder='Волонтер' {...volSelectProps} />
                    //     </FilterDropdown>
                    // )}
                />
                <Table.Column
                    dataIndex='meal_time'
                    key='meal_time'
                    title='Прием пищи'
                    render={(value) => <TextField value={mealTimeById[value]} />}
                />
                <Table.Column
                    dataIndex='kitchen'
                    key='kitchen'
                    title='Кухня'
                    render={(value) => <TextField value={kitchenNameById[value]} />}
                />
                <Table.Column dataIndex='amount' key='amount' title='Кол-во' render={renderText} />
                <Table.Column dataIndex='reason' key='reason' title='Причина' render={renderText} />
                <Table.Column<FeedTransactionEntity>
                    title='Actions'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            {/* <EditButton hideText size='small' recordItemId={record.id} /> */}
                            <DeleteButton hideText size='small' recordItemId={record.ulid} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
