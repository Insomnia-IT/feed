import { useCallback, useMemo, useState } from 'react';
import { List, useTable } from '@refinedev/antd';
import type { CrudFilter, HttpError } from '@refinedev/core';
import { Button, DatePicker, Form, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

import { dayjsExtended, formDateFormat } from 'shared/lib';
import { downloadBlob, getFilenameFromContentDisposition } from 'shared/lib/saveXLSX';
import type { FeedTransactionEntity } from 'interfaces';
import { MEAL_MAP, NEW_API_URL } from 'const';
import { useTransactionsFilters } from './feed-transaction-filters/use-transactions-filters';
import type { FilterItem } from '../vols/vol-list/filters/filter-types';
import { Filters } from '../vols/vol-list/filters/filters';

const { RangePicker } = DatePicker;

type SearchFormValues = {
    search?: string;
    date?: [string, string];
};

export const FeedTransactionList = () => {
    const { filterFields, visibleFilters, setVisibleFilters } = useTransactionsFilters();
    const [activeFilters, setActiveFilters] = useState<Array<FilterItem>>([]);

    const { searchFormProps, tableProps, filters } = useTable<FeedTransactionEntity, HttpError, SearchFormValues>({
        filters: { defaultBehavior: 'replace' },
        onSearch: (values: SearchFormValues) => {
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
                    valueToUse = value.length > 1 ? value.join(',') : String(value[0]);
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

    const tableColumns: ColumnsType<FeedTransactionEntity> = useMemo(
        () => [
            {
                key: 'dateTime',
                title: 'Время',
                render: (_: unknown, record: FeedTransactionEntity) => dayjs(record.dtime).format('DD/MM/YY HH:mm:ss')
            },
            {
                key: 'volunteerName',
                title: 'Волонтер',
                render: (_: unknown, record: FeedTransactionEntity) => record?.volunteer_name || 'Аноним'
            },
            { dataIndex: 'volunteer', title: 'ID волонтера' },
            {
                key: 'feedType',
                title: 'Тип питания',
                render: (_: unknown, record: FeedTransactionEntity) =>
                    record.is_vegan !== null ? (record.is_vegan ? '🥦 Веган' : '🥩 Мясоед') : ''
            },
            {
                key: 'mealType',
                title: 'Прием пищи',
                render: (_: unknown, record: FeedTransactionEntity) => MEAL_MAP[record.meal_time]
            },
            {
                key: 'kitchenName',
                title: 'Кухня',
                render: (_: unknown, record: FeedTransactionEntity) => record?.kitchen_name ?? ''
            },
            { dataIndex: 'amount', title: 'Кол-во' },
            {
                key: 'reason',
                title: 'Причина',
                render: (_: unknown, record: FeedTransactionEntity) => record?.reason ?? ''
            },
            {
                key: 'groupBadgeName',
                title: 'Групповой бейдж',
                render: (_: unknown, record: FeedTransactionEntity) => record?.group_badge_name ?? ''
            },
            {
                key: 'directions',
                title: 'Службы',
                render: (_: unknown, record: FeedTransactionEntity) =>
                    (record?.volunteer_directions ?? []).map((name) => (
                        <Tag key={name} color={'default'} icon={false} closable={false}>
                            {name}
                        </Tag>
                    ))
            }
        ],
        []
    );

    const createAndSaveXLSX = useCallback(async (): Promise<void> => {
        let url = `${NEW_API_URL}/feed-transaction/export-xlsx/?limit=100000`;

        if (filters) {
            filters.forEach((filter: CrudFilter) => {
                if (filter.value && 'field' in filter) {
                    url = url.concat(`&${String(filter.field)}=${encodeURIComponent(String(filter.value))}`);
                }
            });
        }

        const { data, headers } = await axios.get<Blob>(url, { responseType: 'blob' });
        const filename = getFilenameFromContentDisposition(headers['content-disposition'], 'feed-transactions.xlsx');
        downloadBlob(data, filename);
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
            <Table
                onChange={tableProps.onChange}
                loading={tableProps.loading}
                pagination={tableProps.pagination}
                dataSource={tableProps.dataSource}
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
