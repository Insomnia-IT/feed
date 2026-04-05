import { List, useTable } from '@refinedev/antd';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Space, Table, Tag, Tooltip } from 'antd';
import { CrudFilter, HttpError } from '@refinedev/core';
import { FC, useCallback, useMemo, useState } from 'react';
import { DownloadOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

import type { FeedTransactionAnomaly } from 'interfaces';

import { dayjsExtended, formDateFormat } from 'shared/lib';
import { saveXLSX } from 'shared/lib/saveXLSX';
import { FeedTransactionEntity } from 'interfaces';
import { MEAL_MAP, NEW_API_URL } from 'const';
import { ColumnsType } from 'antd/es/table';
import { useTransactionsFilters } from './feed-transaction-filters/use-transactions-filters';
import { FilterItem } from '../vols/vol-list/filters/filter-types';
import { Filters } from '../vols/vol-list/filters/filters';

const { RangePicker } = DatePicker;

const ANOMALY_TOOLTIPS: Record<string, string> = {
    'Бейдж брошен':
        'Бейдж заполнен ненулевыми значениями и 2 из 3 приёмов пищи не был забран',
    Перекорм: 'Выдали порций больше, чем вообще людей этой службы на поле',
    'Не скорректирован':
        'В приёмах пищи подряд выдавали меньше порций, чем существует в бейдже'
};

/** Тип аномалии из поля problem эндпоинта v1/feed-transaction/anomalies */
function anomalyTypeFromProblem(problem: string): string {
    if (!problem) return 'Аномалия';
    const p = problem.toLowerCase();
    if (p.includes('перекорм')) return 'Перекорм';
    if (p.includes('не использовался') || p.includes('бейдж')) return 'Бейдж брошен';
    if (p.includes('неверный план')) return 'Не скорректирован';
    return problem;
}

function tooltipForAnomalyType(problem: string): string {
    const type = anomalyTypeFromProblem(problem);
    return ANOMALY_TOOLTIPS[type] ?? problem;
}

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
    isAnomaly: boolean;
    anomalyType: string;
    serviceName: string;
    /** reason из GET feed-transaction (для тултипа) */
    problem?: string;
}

export const FeedTransactionList: FC = () => {
    const { filterFields, visibleFilters, setVisibleFilters } = useTransactionsFilters();
    const [activeFilters, setActiveFilters] = useState<Array<FilterItem>>([]);
    const [anomaliesModalOpen, setAnomaliesModalOpen] = useState(false);

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

    const dtimeFrom = filters?.find((f: CrudFilter): f is CrudFilter & { field: string } => 'field' in f && f.field === 'dtime_from')?.value as
        | string
        | undefined;
    const dtimeTo = filters?.find((f: CrudFilter): f is CrudFilter & { field: string } => 'field' in f && f.field === 'dtime_to')?.value as
        | string
        | undefined;

    const anomaliesModalRange = useMemo(() => {
        if (dtimeFrom && dtimeTo) return { from: dtimeFrom, to: dtimeTo };
        const yesterday = dayjs().subtract(1, 'day');
        return {
            from: yesterday.startOf('day').toISOString(),
            to: yesterday.endOf('day').toISOString()
        };
    }, [dtimeFrom, dtimeTo]);

    const {
        data: anomaliesModalData = [],
        isLoading: anomaliesModalLoading,
        error: anomaliesModalError
    } = useQuery({
        queryKey: ['feed-transaction-anomalies-modal', anomaliesModalOpen, anomaliesModalRange.from, anomaliesModalRange.to],
        enabled: anomaliesModalOpen,
        queryFn: async (): Promise<FeedTransactionAnomaly[]> => {
            const { data } = await axios.get<FeedTransactionAnomaly[]>(
                `${NEW_API_URL}/feed-transaction/anomalies/`,
                {
                    params: {
                        dtime_from: anomaliesModalRange.from,
                        dtime_to: anomaliesModalRange.to
                    }
                }
            );
            return Array.isArray(data) ? data : [];
        }
    });

    const transformResult = (
        transactions?: Readonly<Array<FeedTransactionEntity>>
    ): Array<TransformedTransaction> => {
        return (
            transactions?.map<TransformedTransaction>((item: FeedTransactionEntity) => {
                const isAnomaly = Boolean(item.is_anomaly);
                const anomalyType = (anomalyTypeFromProblem(item?.reason ?? '') || item?.reason) ?? 'Аномалия';
                const serviceName =
                    (item?.group_badge_name?.trim() && item.group_badge_name) ||
                    item?.kitchen_name ||
                    '—';
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
                    directions: item?.volunteer_directions ?? [],
                    isAnomaly,
                    anomalyType,
                    serviceName,
                    problem: item?.reason ?? undefined
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
        {
            dataIndex: 'isAnomaly',
            title: 'Аномалия',
            render: (_: unknown, row: TransformedTransaction) => (row.isAnomaly ? 'Да' : '—')
        },
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
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
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
                    <Button
                        type="default"
                        icon={<WarningOutlined />}
                        onClick={() => setAnomaliesModalOpen(true)}
                    >
                        Аномалии
                    </Button>
                </div>
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
            <Modal
                title="Аномалии"
                open={anomaliesModalOpen}
                onCancel={() => setAnomaliesModalOpen(false)}
                footer={null}
                width={900}
            >
                {anomaliesModalError ? (
                    <div style={{ color: 'var(--ant-color-error)', marginBottom: 8 }}>
                        Не удалось загрузить данные. Проверьте, что бэкенд доступен и эндпоинт реализован.
                    </div>
                ) : null}
                <Table<FeedTransactionAnomaly>
                    loading={anomaliesModalLoading}
                    dataSource={anomaliesModalData}
                    rowKey={(r, i) => `anomaly-${i}-${r.direction_name}-${r.group_badge_name}-${r.real_amount}`}
                    pagination={{ pageSize: 10 }}
                    columns={[
                        { dataIndex: 'direction_name', title: 'Служба' },
                        { dataIndex: 'group_badge_name', title: 'Групповой бейдж', render: (v: string) => v || '—' },
                        { dataIndex: 'direction_amount', title: 'Размер службы' },
                        {
                            dataIndex: 'calculated_amount',
                            title: 'Ожидаемое кол-во порций',
                            render: (v: number | null) => (v != null ? v : '—')
                        },
                        { dataIndex: 'real_amount', title: 'Выданное кол-во порций' },
                        { dataIndex: 'problem', title: 'Проблема' }
                    ]}
                />
            </Modal>
        </List>
    );
};
