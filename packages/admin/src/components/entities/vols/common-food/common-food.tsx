import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Space, Table, Tooltip, Typography, type TableProps } from 'antd';
import { PlusSquareOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { useList, type HttpError } from '@refinedev/core';
import axios from 'axios';

import { DATETIME_LONG, DATETIME_SHORT, MEAL_MAP, NEW_API_URL } from 'const';
import type { FeedTransactionEntity, KitchenEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { formatInAppTimeZone } from 'shared/lib';
import { downloadBlob, getFilenameFromContentDisposition } from 'shared/lib/saveXLSX';
import useCanAccess from '../use-can-access';

import styles from './common-food.module.css';

const CommonFood = () => {
    const { id: volId } = useParams<{ id: string }>();

    const navigate = useNavigate();
    const { isMobile } = useScreen();
    const canCreate = useCanAccess({
        action: 'create',
        resource: 'feed-transaction'
    });

    const { query: txQuery, result: txResult } = useList<FeedTransactionEntity, HttpError>({
        resource: 'feed-transaction',
        filters: volId ? [{ field: 'volunteer', operator: 'eq', value: volId }] : undefined,
        pagination: {
            mode: 'server',
            pageSize: 10000, // TODO: переделать, когда бэки сделают счетчик
            currentPage: 1
        }
    });

    const rows = useMemo<FeedTransactionEntity[]>(() => txResult.data ?? [], [txResult.data]);
    const foodCount = useMemo<number>(() => rows.reduce<number>((sum, tx) => sum + (tx.amount ?? 0), 0), [rows]);

    const { result: kitchensResult } = useList<KitchenEntity, HttpError>({
        resource: 'kitchens',
        pagination: { mode: 'off' }
    });

    const kitchenNameById = useMemo<Record<string, string>>(() => {
        const entries = (kitchensResult.data ?? []).map(({ id, name }) => [String(id), name]);
        return Object.fromEntries(entries);
    }, [kitchensResult.data]);

    const exportXLSX = useCallback(async () => {
        if (!volId) {
            return;
        }

        const { data, headers } = await axios.get<Blob>(
            `${NEW_API_URL}/feed-transaction/export-xlsx/?volunteer=${encodeURIComponent(volId)}`,
            {
                responseType: 'blob'
            }
        );

        const filename = getFilenameFromContentDisposition(headers['content-disposition'], 'feed-transactions.xlsx');
        downloadBlob(data, filename);
    }, [volId]);

    const columns: TableProps<FeedTransactionEntity>['columns'] = useMemo(
        () => [
            {
                title: 'Время',
                dataIndex: 'dtime',
                render: (dtime: string) => formatInAppTimeZone(dtime, isMobile ? DATETIME_SHORT : DATETIME_LONG)
            },
            {
                title: 'Прием пищи',
                dataIndex: 'meal_time',
                width: isMobile ? 50 : undefined,
                render: (mealTime: FeedTransactionEntity['meal_time']) =>
                    MEAL_MAP[mealTime as keyof typeof MEAL_MAP] ?? 'дожор'
            },
            {
                title: 'Кухня',
                dataIndex: 'kitchen',
                render: (kitchen: FeedTransactionEntity['kitchen']) =>
                    kitchenNameById[String(kitchen)] ?? String(kitchen ?? '')
            },
            {
                title: 'Порция выдана',
                dataIndex: 'amount',
                width: isMobile ? 60 : undefined,
                render: (amount: number) => (amount ? 'Да' : 'Нет')
            },
            {
                title: 'Ошибка',
                dataIndex: 'reason',
                onCell: () => ({ className: styles.reasonCell }),
                render: (txt: string) => (
                    <Tooltip title={txt}>
                        <Typography.Text ellipsis={{ tooltip: false }}>{txt}</Typography.Text>
                    </Tooltip>
                )
            }
        ],
        [isMobile, kitchenNameById]
    );

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space wrap align="center" className={styles.buttonsWrap}>
                <Button
                    icon={<PlusSquareOutlined />}
                    onClick={() => navigate('/feed-transaction/create')}
                    disabled={!canCreate}
                >
                    {isMobile ? 'Порцию' : 'Добавить порцию'}
                </Button>

                <Space align="center">
                    <span className={styles.resultDescr}>
                        <b>Результат:</b> {foodCount} порций
                    </span>
                    <Button type="primary" icon={<VerticalAlignBottomOutlined />} onClick={exportXLSX}>
                        Выгрузить в Excel
                    </Button>
                </Space>
            </Space>

            <Table
                rowKey="ulid"
                columns={columns}
                dataSource={rows}
                loading={txQuery.isLoading}
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: 'max-content' }}
                pagination={false}
            />
        </Space>
    );
};

export default CommonFood;
