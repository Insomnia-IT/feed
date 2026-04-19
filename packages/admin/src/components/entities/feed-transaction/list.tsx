import { useCallback, useEffect, useMemo, useState, type FC, type ReactElement } from 'react';
import { List, useTable } from '@refinedev/antd';
import { useQuery } from '@tanstack/react-query';
import type { CrudFilter, HttpError } from '@refinedev/core';
import {
    Button,
    DatePicker,
    Empty,
    Form,
    Input,
    Modal,
    Pagination,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { FeedTransactionAnomaly, FeedTransactionEntity } from 'interfaces';

import { dayjsExtended, formDateFormat } from 'shared/lib';
import { downloadBlob, getFilenameFromContentDisposition } from 'shared/lib/saveXLSX';
import { useScreen } from 'shared/providers';
import { MEAL_MAP, NEW_API_URL } from 'const';
import { useTransactionsFilters } from './feed-transaction-filters/use-transactions-filters';
import type { FilterItem } from '../vols/vol-list/filters/filter-types';
import { Filters } from '../vols/vol-list/filters/filters';

const { RangePicker } = DatePicker;

type SearchFormValues = {
    search?: string;
    date?: [string, string];
};

const ANOMALY_TOOLTIPS: Record<string, string> = {
    'Бейдж брошен': 'Бейдж заполнен ненулевыми значениями и 2 из 3 приёмов пищи не был забран',
    Перекорм: 'Выдали порций больше, чем вообще людей этой службы на поле',
    'Не скорректирован': 'В приёмах пищи подряд выдавали меньше порций, чем существует в бейдже'
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

const ANOMALY_MODAL_PAGE_SIZE = 10;

const anomalyModalColumns: ColumnsType<FeedTransactionAnomaly> = [
    { dataIndex: 'direction_name', title: 'Служба', ellipsis: true },
    {
        dataIndex: 'group_badge_name',
        title: 'Групповой бейдж',
        ellipsis: true,
        render: (v: string) => v || '—'
    },
    { dataIndex: 'direction_amount', title: 'Размер службы', width: 120 },
    {
        dataIndex: 'calculated_amount',
        title: 'Ожидаемое кол-во порций',
        width: 160,
        render: (v: number | null) => (v != null ? v : '—')
    },
    { dataIndex: 'real_amount', title: 'Выданное кол-во порций', width: 160 },
    { dataIndex: 'problem', title: 'Проблема', ellipsis: true }
];

function AnomalyMobileCard({ row }: { row: FeedTransactionAnomaly }): ReactElement {
    const type = anomalyTypeFromProblem(row.problem);
    const tooltip = tooltipForAnomalyType(row.problem);
    return (
        <div
            style={{
                border: '1px solid var(--ant-color-border-secondary)',
                borderRadius: 10,
                padding: 12,
                background: 'var(--ant-color-fill-quaternary)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 10
                }}
            >
                <Typography.Text strong style={{ flex: 1, fontSize: 15, wordBreak: 'break-word' }}>
                    {row.direction_name || '—'}
                </Typography.Text>
                <Tooltip title={tooltip}>
                    <Tag color="warning" style={{ marginInlineEnd: 0, flexShrink: 0 }}>
                        {type}
                    </Tag>
                </Tooltip>
            </div>
            <div
                style={{
                    display: 'grid',
                    gap: 8,
                    fontSize: 13
                }}
            >
                <div>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        Групповой бейдж
                    </Typography.Text>
                    {row.group_badge_name || '—'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                            Размер службы
                        </Typography.Text>
                        {row.direction_amount}
                    </div>
                    <div>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                            Ожидаемое
                        </Typography.Text>
                        {row.calculated_amount != null ? row.calculated_amount : '—'}
                    </div>
                </div>
                <div>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        Выдано порций
                    </Typography.Text>
                    {row.real_amount}
                </div>
                <div>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        Проблема
                    </Typography.Text>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>{row.problem || '—'}</Typography.Paragraph>
                </div>
            </div>
        </div>
    );
}

interface TransformedTransaction {
    ulid: string;
    dateTime: string;
    volunteerName: string;
    volunteerId: number;
    feedType: string;
    isPaid: string;
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
    const { isMobile } = useScreen();
    const [activeFilters, setActiveFilters] = useState<Array<FilterItem>>([]);
    const [anomaliesModalOpen, setAnomaliesModalOpen] = useState(false);

    const [anomaliesRange, setAnomaliesRange] = useState<[Dayjs, Dayjs]>(() => {
        const to = dayjsExtended();
        const from = to.subtract(24, 'hour');
        return [from, to];
    });

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

                if (typeof value === 'undefined') {
                    return;
                }

                let valueToUse: string = typeof value === 'boolean' ? String(value) : (value as string);

                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return;
                    }

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

    const anomaliesModalDtimeFrom = useMemo(() => anomaliesRange[0]?.toISOString(), [anomaliesRange]);
    const anomaliesModalDtimeTo = useMemo(() => anomaliesRange[1]?.toISOString(), [anomaliesRange]);

    const {
        data: anomaliesModalData = [],
        isLoading: anomaliesModalLoading,
        error: anomaliesModalError
    } = useQuery({
        queryKey: [
            'feed-transaction-anomalies-modal',
            anomaliesModalOpen,
            anomaliesModalDtimeFrom,
            anomaliesModalDtimeTo
        ],
        enabled: Boolean(anomaliesModalOpen && anomaliesModalDtimeFrom && anomaliesModalDtimeTo),
        queryFn: async (): Promise<FeedTransactionAnomaly[]> => {
            const { data } = await axios.get<FeedTransactionAnomaly[]>(`${NEW_API_URL}/feed-transaction/anomalies`, {
                params: {
                    dtime_from: anomaliesModalDtimeFrom,
                    dtime_to: anomaliesModalDtimeTo
                }
            });
            return Array.isArray(data) ? data : [];
        }
    });

    const [anomalyPage, setAnomalyPage] = useState(1);
    const [isCompactAnomalies, setIsCompactAnomalies] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 991px)').matches : false
    );

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 991px)');
        const apply = (): void => setIsCompactAnomalies(mq.matches);
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    const anomaliesModalPaged = useMemo(() => {
        const start = (anomalyPage - 1) * ANOMALY_MODAL_PAGE_SIZE;
        return anomaliesModalData.slice(start, start + ANOMALY_MODAL_PAGE_SIZE);
    }, [anomaliesModalData, anomalyPage]);

    const applyAnomaliesPreset = (preset: 'today' | 'yesterday' | 'beforeYesterday' | 'last3Days'): void => {
        const now = dayjsExtended();
        if (preset === 'today') {
            setAnomaliesRange([now.startOf('day'), now.endOf('day')]);
            setAnomalyPage(1);
            return;
        }

        if (preset === 'yesterday') {
            const d = now.subtract(1, 'day');
            setAnomaliesRange([d.startOf('day'), d.endOf('day')]);
            setAnomalyPage(1);
            return;
        }

        if (preset === 'beforeYesterday') {
            const d = now.subtract(2, 'day');
            setAnomaliesRange([d.startOf('day'), d.endOf('day')]);
            setAnomalyPage(1);
            return;
        }

        const from = now.subtract(2, 'day').startOf('day');
        setAnomaliesRange([from, now.endOf('day')]);
        setAnomalyPage(1);
    };

    const transformResult = (transactions?: Readonly<Array<FeedTransactionEntity>>): Array<TransformedTransaction> => {
        return (
            transactions?.map<TransformedTransaction>((item: FeedTransactionEntity) => {
                const isAnomaly = Boolean(item.is_anomaly);
                const anomalyType = (anomalyTypeFromProblem(item?.reason ?? '') || item?.reason) ?? 'Аномалия';
                const serviceName =
                    (item?.group_badge_name?.trim() && item.group_badge_name) || item?.kitchen_name || '—';
                return {
                    ulid: item.ulid,
                    dateTime: dayjs(item.dtime).format('DD/MM/YY HH:mm:ss'),
                    volunteerName: item?.volunteer_name || 'Аноним',
                    volunteerId: item.volunteer,
                    feedType: item.is_vegan !== null ? (item.is_vegan ? '🥦 Веган' : '🥩 Мясоед') : '',
                    isPaid: item.is_paid !== null ? (item.is_paid ? 'Да' : 'Нет') : '',
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
        { dataIndex: 'isPaid', title: 'Платное' },
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
        <List
            headerButtons={({ defaultButtons }) => (
                <>
                    <Button type="default" icon={<WarningOutlined />} onClick={() => setAnomaliesModalOpen(true)}>
                        Аномалии
                    </Button>
                    {!isMobile && defaultButtons}
                </>
            )}
        >
            <Form {...searchFormProps}>
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 8
                    }}
                >
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
                </div>
                <Filters
                    filterFields={filterFields}
                    visibleFilters={visibleFilters}
                    setVisibleFilters={setVisibleFilters}
                    activeFilters={activeFilters}
                    isMobile={isMobile}
                    setActiveFilters={(next) => {
                        setActiveFilters(next);
                        setTimeout(() => searchFormProps?.form?.submit());
                    }}
                />
            </Form>
            <Table<TransformedTransaction>
                onChange={tableProps.onChange as TableProps<TransformedTransaction>['onChange']}
                loading={tableProps.loading}
                pagination={
                    tableProps.pagination
                        ? {
                              ...tableProps.pagination,
                              showTotal: (total) => `Всего: ${total}`
                          }
                        : false
                }
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
                afterOpenChange={(open) => {
                    if (!open) return;
                    const to = dayjsExtended();
                    const from = to.subtract(24, 'hour');
                    setAnomaliesRange([from, to]);
                    setAnomalyPage(1);
                }}
                onCancel={() => setAnomaliesModalOpen(false)}
                footer={null}
                width={isCompactAnomalies ? 'min(calc(100vw - 16px), 900px)' : 900}
                style={{ maxWidth: '100vw' }}
                centered
                styles={{
                    body: { padding: isCompactAnomalies ? 12 : undefined }
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginBottom: 12
                    }}
                >
                    <RangePicker
                        value={anomaliesRange}
                        onChange={(values) => {
                            if (!values) return;
                            const [from, to] = values;
                            if (!from || !to) return;
                            setAnomaliesRange([from, to]);
                            setAnomalyPage(1);
                        }}
                        format={formDateFormat}
                        allowClear={false}
                    />
                    <Space size={8} wrap={true}>
                        <Button size="small" onClick={() => applyAnomaliesPreset('today')}>
                            Сегодня
                        </Button>
                        <Button size="small" onClick={() => applyAnomaliesPreset('yesterday')}>
                            Вчера
                        </Button>
                        <Button size="small" onClick={() => applyAnomaliesPreset('beforeYesterday')}>
                            Позавчера
                        </Button>
                        <Button size="small" onClick={() => applyAnomaliesPreset('last3Days')}>
                            Последние 3 суток
                        </Button>
                    </Space>
                </div>
                {anomaliesModalError ? (
                    <div style={{ color: 'var(--ant-color-error)', marginBottom: 8 }}>
                        Не удалось загрузить данные. Проверьте, что бэкенд доступен и эндпоинт реализован.
                    </div>
                ) : null}
                <Spin spinning={anomaliesModalLoading}>
                    {isCompactAnomalies ? (
                        !anomaliesModalLoading && anomaliesModalData.length === 0 ? (
                            <Empty description="Нет данных" />
                        ) : (
                            <>
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    {anomaliesModalPaged.map((row, i) => (
                                        <AnomalyMobileCard
                                            key={`anomaly-${anomalyPage}-${i}-${row.direction_name}-${row.group_badge_name}-${row.real_amount}`}
                                            row={row}
                                        />
                                    ))}
                                </Space>
                                {anomaliesModalData.length > ANOMALY_MODAL_PAGE_SIZE ? (
                                    <Pagination
                                        current={anomalyPage}
                                        pageSize={ANOMALY_MODAL_PAGE_SIZE}
                                        total={anomaliesModalData.length}
                                        onChange={setAnomalyPage}
                                        size="small"
                                        showSizeChanger={false}
                                        style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}
                                    />
                                ) : null}
                            </>
                        )
                    ) : (
                        <Table<FeedTransactionAnomaly>
                            loading={false}
                            dataSource={anomaliesModalData}
                            rowKey={(r, i) => `anomaly-${i}-${r.direction_name}-${r.group_badge_name}-${r.real_amount}`}
                            pagination={{ pageSize: ANOMALY_MODAL_PAGE_SIZE }}
                            columns={anomalyModalColumns}
                            scroll={{ x: 'max-content' }}
                        />
                    )}
                </Spin>
            </Modal>
        </List>
    );
};
