import { DateField, DeleteButton, List, Space, Table, TextField, useTable } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';
import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input } from 'antd';

import { saveXLSX } from '~/shared/lib/saveXLSX';
import type { FeedTransactionEntity, KitchenEntity, VolEntity } from '~/interfaces';

const ExcelJS = require('exceljs');

interface FeedTransactionMapped extends FeedTransactionEntity {
    vol_nickname: string;
}

const mealTimeById = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const FeedTransactionList: FC<IResourceComponentsProps> = () => {
    const [searchText, setSearchText] = useState('');
    const [mappedData, setMappedData] = useState<Array<FeedTransactionMapped> | null>(null);
    const [filteredData, setFilteredData] = useState<Array<FeedTransactionMapped> | null>(null);

    const { tableProps } = useTable<FeedTransactionEntity>();

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

    const createAndSaveXLSX = () => {
        if (filteredData) {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Transactions log');

            const header = ['Время', 'Волонтер', 'Бейдж', 'Веган', 'Прием пищи', 'Кухня', 'Кол-во', 'Причина'];
            sheet.addRow(header);

            filteredData.forEach((tx) => {
                sheet.addRow([
                    tx.dtime,
                    tx.vol_nickname,
                    tx.qr_code,
                    tx.is_vegan ? 'Да' : 'Нет',
                    tx.meal_time,
                    kitchenNameById[tx.kitchen],
                    tx.amount,
                    tx.reason
                ]);
            });
            void saveXLSX(workbook, 'feed-transactions');
        }
    };

    useEffect(() => {
        if (tableProps.dataSource) {
            setMappedData(
                tableProps.dataSource.map((tx) => {
                    return {
                        ...tx,
                        vol_nickname: volNameById[tx.volunteer] ?? 'Аноним'
                    };
                })
            );
        }
    }, [tableProps.dataSource, volNameById]);
    useEffect(() => {
        if (mappedData) {
            setFilteredData(() => {
                return searchText
                    ? mappedData.filter((item) => {
                          const searchTextInLowerCase = searchText.toLowerCase();
                          return [item.vol_nickname, item.qr_code].some((text) => {
                              return text?.toLowerCase().includes(searchTextInLowerCase);
                          });
                      })
                    : mappedData;
            });
        }
    }, [searchText, mappedData]);

    const Footer = (): JSX.Element => {
        return (
            <Button onClick={() => createAndSaveXLSX()} disabled={!filteredData}>
                Выгрузить
            </Button>
        );
    };

    return (
        <List>
            <Form style={{ marginBottom: '16px' }}>
                <Input
                    value={searchText ?? undefined}
                    placeholder={'Имя волонтера, код бэйджа'}
                    onChange={(e) => setSearchText(e.target.value)}
                ></Input>
            </Form>
            <Table dataSource={filteredData} rowKey='ulid' footer={Footer}>
                <Table.Column
                    dataIndex='dtime'
                    key='dtime'
                    title='Время'
                    render={(value) => value && <DateField format='DD/MM/YY HH:mm:ss' value={value} />}
                />
                <Table.Column
                    dataIndex='vol_nickname'
                    title='Волонтер'
                    render={(value) => <TextField value={value} />}
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
