import { DeleteButton, List, useTable } from '@refinedev/antd';
import { Button, DatePicker, Form, Input, Space, Table, Tag } from 'antd';
import { CrudFilter, HttpError } from '@refinedev/core';
import { FC, ReactNode, useCallback, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

import { dayjsExtended, formDateFormat } from 'shared/lib';
import { saveXLSX } from 'shared/lib/saveXLSX';
import { FeedTransactionEntity } from 'interfaces';
import { MEAL_MAP, NEW_API_URL } from 'const';
import { ColumnsType } from 'antd/es/table';
import { useTransactionsFilters } from './feed-transaction-filters/use-transactions-filters';
import { FilterItem } from '../vols/vol-list/filters/filter-types';
import { Filters } from '../vols/vol-list/filters/filters';

const { RangePicker } = DatePicker;

interface TransformedTransaction {
    ulid: string;
    dateTime: string;
    volunteerName: string;
    volunteerId: number;
    feedType: string;
    mealType: string;
    kitchenName: string;
    amount: number;
    reason?: string;
    groupBadgeName: string;
    directions: Array<string>;
}

export const FeedTransactionList: FC = () => {
    const { filterFields, visibleFilters, setVisibleFilters } = useTransactionsFilters();
    const [activeFilters, setActiveFilters] = useState<Array<FilterItem>>([]);

    const { searchFormProps, tableProps, filters, setCurrent, setPageSize } = useTable<
        FeedTransactionEntity,
        HttpError,
        { search?: string; date?: [string, string] }
    >({
        defaultSetFilterBehavior: 'replace',
        onSearch: (values: { search?: string; date?: [string, string] }) => {
            const newFilters: Array<CrudFilter> = [];

            newFilters.push({
                field: 'search',
                value: values.search,
                operator: 'contains'
            });

            if (values.date) {
                newFilters.push(
                    {
                        field: 'dtime_from',
                        value: dayjsExtended(values.date[0]).startOf('day').toISOString(),
                        operator: 'gte'
                    },
                    {
                        field: 'dtime_to',
                        value: dayjsExtended(values.date[1]).endOf('day').toISOString(),
                        operator: 'lte'
                    }
                );
            }

            activeFilters.forEach((filter) => {
                const { name, value } = filter;

                let valueToUse: string = typeof value === 'boolean' ? String(value) : (value as string);

                if (Array.isArray(value)) {
                    valueToUse = value.length > 1 ? value.join(',') : String(valueToUse[0]);
                }

                newFilters.push({
                    field: name,
                    value: valueToUse,
                    operator: 'eq'
                });
            });

            return newFilters;
        }
    });

    const transformResult = (transactions?: Readonly<Array<FeedTransactionEntity>>): Array<TransformedTransaction> => {
        return (
            transactions?.map<TransformedTransaction>((item: FeedTransactionEntity) => {
                return {
                    ulid: item.ulid,
                    dateTime: dayjs(item.dtime).format('DD/MM/YY HH:mm:ss'),
                    volunteerName: item?.volunteer_name || 'Аноним',
                    volunteerId: item.volunteer,
                    feedType: item.is_vegan !== null ? (item.is_vegan ? '🥦 Веган' : '🥩 Мясоед') : '',
                    mealType: MEAL_MAP[item.meal_time],
                    kitchenName: item?.kitchen_name ?? '',
                    amount: item.amount,
                    reason: item?.reason ?? undefined,
                    groupBadgeName: item.group_badge_name ?? '',
                    directions: item?.volunteer_directions ?? []
                };
            }) ?? []
        );
    };

    const transformedResult = transformResult(tableProps?.dataSource);

    const tableColumns: ColumnsType<TransformedTransaction> = [
        {
            dataIndex: 'dateTime',
            title: 'Время'
        },
        { dataIndex: 'volunteerName', title: 'Волонтер' },
        { dataIndex: 'volunteerId', title: 'ID волонтера' },
        { dataIndex: 'feedType', title: 'Тип питания' },
        { dataIndex: 'mealType', title: 'Прием пищи' },
        { dataIndex: 'kitchenName', title: 'Кухня' },
        { dataIndex: 'amount', title: 'Кол-во' },
        { dataIndex: 'reason', title: 'Причина' },
        { dataIndex: 'groupBadgeName', title: 'Групповой бейдж' },
        {
            dataIndex: 'directions',
            title: 'Службы',
            render: (value: string[]) => {
                return value.map((name) => (
                    <Tag key={name} color={'default'} icon={false} closable={false}>
                        {name}
                    </Tag>
                ));
            }
        },
        {
            title: 'Действия',
            render: (_: unknown, record: TransformedTransaction): ReactNode => (
                <Space>
                    <DeleteButton hideText size="small" recordItemId={record.ulid} />
                </Space>
            )
        }
    ];

    const createAndSaveXLSX = useCallback(async (): Promise<void> => {
        const ExcelJS = await import('exceljs');

        let url = `${NEW_API_URL}/feed-transaction/?limit=100000`;

        if (filters) {
            filters.forEach((filter: CrudFilter) => {
                if (filter.value && 'field' in filter) {
                    url = url.concat(`&${filter?.field}=${filter.value}`);
                }
            });
        }

        const { data } = await axios.get(url);
        const transactions = data.results as Array<FeedTransactionEntity>;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Transactions log');

        const header = [
            'Дата',
            'Время',
            'ID волонтера',
            'Позывной',
            'Фамилия Имя',
            'Тип питания',
            'Прием пищи',
            'Кухня',
            'Кол-во',
            'Причина',
            'Групповой бейдж',
            'Службы'
        ];
        sheet.addRow(header);

        transactions?.forEach((tx) => {
            sheet.addRow([
                dayjs(tx.dtime).format('DD.MM.YYYY'),
                dayjs(tx.dtime).format('HH:mm:ss'),
                tx.volunteer,
                tx?.volunteer_name ?? 'Аноним',
                [tx.volunteer_last_name, tx.volunteer_first_name].filter((item) => !!item).join(' '),
                tx.is_vegan !== null ? (tx.is_vegan ? '🥦 Веган' : '🥩 Мясоед') : '',
                MEAL_MAP[tx.meal_time],
                tx?.kitchen_name ?? '',
                tx.amount,
                tx?.reason ?? '',
                tx?.group_badge_name ?? '',
                (tx?.volunteer_directions ?? []).join(',')
            ]);
        });

        void saveXLSX(workbook, 'feed-transactions');
    }, [filters]);

    const handleClickDownload = useCallback((): void => {
        void createAndSaveXLSX();
    }, [createAndSaveXLSX]);

    return (
        <List>
            <Form {...searchFormProps}>
                <Space align="start">
                    <Form.Item name="search">
                        <Input placeholder="Имя волонтера" allowClear />
                    </Form.Item>
                    <Form.Item name="date">
                        <RangePicker format={formDateFormat} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">
                        Применить
                    </Button>
                    <Button
                        type="default"
                        htmlType="reset"
                        onClick={() => {
                            setActiveFilters([]);
                            setVisibleFilters([]);
                            searchFormProps?.form?.resetFields();
                            searchFormProps?.form?.submit();
                        }}
                    >
                        Очистить
                    </Button>
                </Space>
                <Filters
                    filterFields={filterFields}
                    visibleFilters={visibleFilters}
                    setVisibleFilters={setVisibleFilters}
                    activeFilters={activeFilters}
                    setActiveFilters={(filters) => {
                        setActiveFilters(filters);

                        // Для более отзывчивого поведения
                        setTimeout(() => searchFormProps?.form?.submit());
                    }}
                />
            </Form>
            <Table<TransformedTransaction>
                loading={tableProps.loading}
                pagination={{
                    ...tableProps.pagination,
                    onChange: (page, size) => {
                        setCurrent(page);

                        if (typeof size === 'number') {
                            setPageSize(size);
                        }
                    }
                }}
                dataSource={transformedResult}
                rowKey="ulid"
                footer={() => (
                    <Button type="primary" onClick={handleClickDownload} icon={<DownloadOutlined />}>
                        Выгрузить
                    </Button>
                )}
                columns={tableColumns}
            />
        </List>
    );
};
