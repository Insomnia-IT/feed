import { FC, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Space, Table, Tooltip, Typography, type TableProps } from 'antd';
import { PlusSquareOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { useList, HttpError } from '@refinedev/core';
import dayjs from 'dayjs';

import axios from 'axios';
import { DATETIME_LONG, DATETIME_SHORT, MEAL_MAP, NEW_API_URL } from 'const';
import type { FeedTransactionEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { downloadBlob, getFilenameFromContentDisposition } from 'shared/lib/saveXLSX';
import useCanAccess from '../use-can-access';

import styles from './common-food.module.css';

const CommonFood: FC = () => {
    const { id: volId } = useParams<{ id: string }>();

    const navigate = useNavigate();
    const { isMobile } = useScreen();
    const canCreate = useCanAccess({
        action: 'create',
        resource: 'feed-transaction'
    });

    const { data: txResp, isLoading } = useList<FeedTransactionEntity, HttpError>({
        resource: 'feed-transaction',
        filters: volId ? [{ field: 'volunteer', operator: 'eq', value: volId }] : undefined,
        pagination: {
            mode: 'server',
            pageSize: 10000, // TODO: переделать, когда бэки сделают счетчик
            current: 1
        }
    });

    const rows = useMemo(() => txResp?.data ?? [], [txResp?.data]);
    const foodCount = useMemo(() => rows.reduce((sum, { amount }) => sum + amount, 0), [rows]);

    const exportXLSX = useCallback(async () => {
        if (!volId) {
            return;
        }

        const { data, headers } = await axios.get<Blob>(
            `${NEW_API_URL}/feed-transaction/export-xlsx/?volunteer=${volId}`,
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
                render: (dtime: string) => dayjs(dtime).format(isMobile ? DATETIME_SHORT : DATETIME_LONG)
            },
            {
                title: 'Прием пищи',
                dataIndex: 'meal_time',
                width: isMobile ? 50 : 'default',
                render: (mealTime: string) => MEAL_MAP[mealTime] ?? 'дожор'
            },
            {
                title: 'Кухня',
                dataIndex: 'kitchen'
            },
            {
                title: 'Порция выдана',
                dataIndex: 'amount',
                width: isMobile ? 60 : 'default',
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
        [isMobile]
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
                loading={isLoading}
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: 'max-content' }}
                pagination={false}
            />
        </Space>
    );
};

export default CommonFood;
