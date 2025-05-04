import { useList } from '@refinedev/core';
import { Button, Table } from 'antd';
import { PlusSquareOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

import type { FeedTransactionEntity, KitchenEntity } from 'interfaces';
import { saveXLSX } from 'shared/lib/saveXLSX';
import useCanAccess from './use-can-access';

import styles from './common.module.css';

const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () =>
            setScreenSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return screenSize;
};

export function CommonFoodTest() {
    const navigate = useNavigate();
    const canCreateFeedTransaction = useCanAccess({
        action: 'create',
        resource: 'feed-transaction'
    });
    const screenSize = useScreenSize();

    const { id: volId } = useParams<{ id: string }>();
    const { data } = useList<FeedTransactionEntity>({
        resource: 'feed-transaction',
        filters: [
            {
                field: 'volunteer',
                value: String(volId),
                operator: 'eq'
            }
        ]
    });

    const { foodData, foodCount }: { foodData: FeedTransactionEntity[]; foodCount: number } = useMemo(() => {
        const foodData = data?.data ?? [];
        const foodCount = foodData.reduce((sum, item) => sum + item.amount, 0);

        return { foodData, foodCount };
    }, [data]);

    const handleCreateClick = () => {
        navigate('/feed-transaction/create');
    };

    const formatDate = (isoDate: string) => dayjs(isoDate).format('DD MMMM HH:mm:ss');

    const translateMealType = (mealType: string) =>
        ({ breakfast: 'завтрак', lunch: 'обед', dinner: 'ужин' })[mealType] || 'дожор?';

    const columns = [
        {
            title: 'Время',
            render: (_: unknown, item: FeedTransactionEntity) => formatDate(item.dtime)
        },
        {
            title: 'Прием пищи',
            render: (_: unknown, item: FeedTransactionEntity) => translateMealType(item.meal_time)
        },
        { title: 'Кухня', dataIndex: 'kitchen' },
        {
            title: 'Порция выдана',
            render: (_: unknown, item: FeedTransactionEntity) => (item.amount ? 'Да' : 'Нет')
        },
        { title: 'Ошибка', dataIndex: 'reason' }
    ];

    const kitchensQuery = useList<KitchenEntity>({ resource: 'kitchens' });

    const kitchenNameById = useMemo(
        () =>
            (kitchensQuery?.data?.data.reduce((acc, kitchen) => ({ ...acc, [kitchen.id]: kitchen.name }), {}) ||
                {}) as Record<string, string>,
        [kitchensQuery]
    );

    const createAndSaveXLSX = useCallback(() => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Transactions log');

        sheet.addRow([
            'Дата',
            'Время',
            'ID волонтера',
            'Волонтер',
            'Тип питания',
            'Прием пищи',
            'Кухня',
            'Кол-во',
            'Причина'
        ]);

        foodData?.forEach((tx) => {
            sheet.addRow([
                dayjs(tx.dtime).format('DD.MM.YYYY'),
                dayjs(tx.dtime).format('HH:mm:ss'),
                tx.volunteer,
                tx?.volunteer_name || 'Аноним',
                tx.is_vegan ? 'Веган' : 'Мясоед',
                translateMealType(tx.meal_time),
                kitchenNameById[tx.kitchen],
                tx.amount,
                tx.reason
            ]);
        });

        void saveXLSX(workbook, 'feed-transactions');
    }, [kitchenNameById, foodData]);

    return (
        <div>
            <div className={styles.buttonsWrap}>
                <Button onClick={handleCreateClick} disabled={!canCreateFeedTransaction}>
                    <PlusSquareOutlined />
                    {screenSize.width <= 576 ? 'Порцию' : 'Добавить порцию'}
                </Button>
                <div className={styles.createTableWrap}>
                    <span className={styles.resultDescr}>
                        <b>Результат:</b>
                        {` ${foodCount} порций`}
                    </span>
                    <Button type="primary" onClick={createAndSaveXLSX}>
                        <VerticalAlignBottomOutlined />
                        Выгрузить в Excel
                    </Button>
                </div>
            </div>
            <Table columns={columns} dataSource={foodData} rowKey="ulid" />
        </div>
    );
}
