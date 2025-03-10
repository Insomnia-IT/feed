import { DeleteButton, List, useTable } from '@refinedev/antd';
import { Button, DatePicker, Form, Input, Space, Table, Tag } from 'antd';
import { CrudFilter, HttpError, useList } from '@refinedev/core';
import { FC, ReactNode, useCallback, useMemo } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

import { dayjsExtended, formDateFormat } from 'shared/lib';
import { saveXLSX } from 'shared/lib/saveXLSX';
import { DirectionEntity, FeedTransactionEntity, GroupBadgeEntity, KitchenEntity, VolEntity } from 'interfaces';
import { NEW_API_URL } from 'const';
import { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

const mealTimeById: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

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
    const { searchFormProps, tableProps, filters, setFilters, setCurrent, setPageSize } = useTable<
        FeedTransactionEntity,
        HttpError,
        { search?: string; date?: [string, string] }
    >({
        onSearch: (values: { search?: string; date?: [string, string] }) => {
            setFilters([]);
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
            } else {
                // Без этого фильтры некорректно сбрасываются
                newFilters.push(
                    {
                        field: 'dtime_from',
                        value: null,
                        operator: 'gte'
                    },
                    {
                        field: 'dtime_to',
                        value: null,
                        operator: 'lte'
                    }
                );
            }

            return newFilters;
        }
    });

    const { data: vols, isLoading: volsIsLoading } = useList<VolEntity>({
        resource: 'volunteers',
        pagination: {
            pageSize: 10000
        }
    });

    const { data: kitchens, isLoading: kitchensIsLoading } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const { data: groupBadges, isLoading: groupBadgesIsLoading } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        pagination: {
            pageSize: 10000
        }
    });

    const getGroupBadgeById = useCallback(
        (id?: number): GroupBadgeEntity | undefined => {
            if (typeof id !== 'number') {
                return;
            }

            return groupBadges?.data?.find((badge) => badge.id === id);
        },
        [groupBadges]
    );

    const volById = useMemo(() => {
        return (vols ? vols.data : []).reduce(
            (acc, vol) => ({
                ...acc,
                [vol.id]: vol
            }),
            {} as Record<string, VolEntity>
        );
    }, [vols]);

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {} as Record<string, string>
        );
    }, [kitchens]);

    const getTargetDirections = (item: FeedTransactionEntity): DirectionEntity[] => {
        const targetGroupBadge = getGroupBadgeById(item.group_badge);
        return (
            volById?.[item.volunteer]?.directions ?? (targetGroupBadge?.direction ? [targetGroupBadge.direction] : [])
        );
    };

    const transformResult = (transactions?: Readonly<Array<FeedTransactionEntity>>): Array<TransformedTransaction> => {
        return (
            transactions?.map<TransformedTransaction>((item: FeedTransactionEntity) => {
                const targetGroupBadge = getGroupBadgeById(item.group_badge);
                const targetDirections = getTargetDirections(item);

                return {
                    ulid: item.ulid,
                    dateTime: dayjs(item.dtime).format('DD/MM/YY HH:mm:ss'),
                    volunteerName: volById?.[item.volunteer]?.name || 'Аноним',
                    volunteerId: item.volunteer,
                    feedType: item.is_vegan !== null ? (item.is_vegan ? '🥦 Веган' : '🥩 Мясоед') : '',
                    mealType: mealTimeById[item.meal_time],
                    kitchenName: kitchenNameById[item.kitchen],
                    amount: item.amount,
                    reason: item?.reason ?? undefined,
                    groupBadgeName: targetGroupBadge?.name ?? '',
                    directions: targetDirections.map((dir) => dir?.name)
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
            const volunteer = volById[tx.volunteer];

            sheet.addRow([
                dayjs(tx.dtime).format('DD.MM.YYYY'),
                dayjs(tx.dtime).format('HH:mm:ss'),
                tx.volunteer,
                tx.volunteer ? volunteer?.name : 'Аноним',
                [volunteer?.last_name, volunteer?.first_name].filter((item) => !!item).join(' '),
                tx.is_vegan !== null ? (tx.is_vegan ? '🥦 Веган' : '🥩 Мясоед') : '',
                mealTimeById[tx.meal_time],
                kitchenNameById[tx.kitchen],
                tx.amount,
                tx?.reason ?? '',
                getGroupBadgeById(tx.group_badge),
                getTargetDirections(tx)
                    .map((dir) => dir.name)
                    .join(',')
            ]);
        });

        void saveXLSX(workbook, 'feed-transactions');
    }, [filters, kitchenNameById, volById, getGroupBadgeById]);

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
                            searchFormProps?.form?.resetFields();
                            searchFormProps?.form?.submit();
                        }}
                    >
                        Очистить
                    </Button>
                </Space>
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
                    <Button
                        type="primary"
                        onClick={handleClickDownload}
                        icon={<DownloadOutlined />}
                        disabled={volsIsLoading || kitchensIsLoading || groupBadgesIsLoading}
                    >
                        Выгрузить
                    </Button>
                )}
                columns={tableColumns}
            />
        </List>
    );
};
