import { Button, Table } from '@pankod/refine-antd';
import { PlusSquareOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { useList } from '@pankod/refine-core';

import type { FeedTransactionEntity, KitchenEntity, VolEntity } from '~/interfaces';
import { saveXLSX } from '~/shared/lib/saveXLSX';
import { NEW_API_URL } from '~/const';

import styles from './common.module.css';

interface IData {
    count: number;
    next: number;
    previous: number;
    results: Array<FeedTransactionEntity>;
}

export function CommonFoodTest() {
    const url = document.location.pathname;
    const matchResult = url.match(/\/(\d+)$/);
    const volId = matchResult ? matchResult[1] : null;
    const router = useRouter();
    const [foodCount, setFoodCount] = useState(0);
    const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
        const handleResize = () => {
            setScreenSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCreateClick = () => {
        void router.push('/feed-transaction/create');
    };
    const URL_TRANSACTION = `${NEW_API_URL}/feed-transaction/?volunteer=`;
    const loadFoodData = async () => {
        const response = await axios.get(`${URL_TRANSACTION}${volId}`);
        const result: IData = response.data;
        setFoodCount(result.count);
        setFoodData(result.results);
    };

    function formatDate(isoDateString: string) {
        return new Date(isoDateString).toLocaleString('ru', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function translateMealType(mealType: string) {
        switch (mealType) {
            case 'breakfast':
                return 'завтрак';
            case 'lunch':
                return 'обед';
            case 'dinner':
                return 'ужин';
            default:
                return 'дожор?';
        }
    }

    const [foodData, setFoodData] = useState<Array<FeedTransactionEntity>>([]);

    useEffect(() => {
        void loadFoodData();
    }, []);

    const columns = [
        {
            title: 'Время',
            render: (_: unknown, item: FeedTransactionEntity) => {
                return formatDate(item.dtime);
            }
        },
        {
            title: 'Прием пищи',
            render: (_: unknown, item: FeedTransactionEntity) => {
                return translateMealType(item.meal_time);
            }
        },
        {
            title: 'Кухня',
            dataIndex: 'kitchen'
        },
        {
            title: 'Ошибка',
            dataIndex: 'reason'
        }
    ];

    const { data: vols, isLoading: volsIsLoading } = useList<VolEntity>({
        resource: 'volunteers',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });
    const { data: kitchens, isLoading: kitchensIsLoading } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const volNameById = useMemo(() => {
        return (vols ? vols.data : []).reduce(
            (acc, vol) => ({
                ...acc,
                [vol.id]: vol.name
            }),
            {}
        );
    }, [vols, foodData]);

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {}
        );
    }, [kitchens, foodData]);

    const mealTimeById = {
        breakfast: 'Завтрак',
        lunch: 'Обед',
        dinner: 'Ужин',
        night: 'Дожор'
    };

    const createAndSaveXLSX = useCallback(() => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Transactions log');

        const header = [
            'Дата',
            'Время',
            'ID волонтера',
            'Волонтер',
            'Тип питания',
            'Прием пищи',
            'Кухня',
            'Кол-во',
            'Причина'
        ];
        sheet.addRow(header);

        foodData?.forEach((tx) => {
            sheet.addRow([
                dayjs(tx.dtime).format('DD.MM.YYYY'),
                dayjs(tx.dtime).format('HH:mm:ss'),
                tx.volunteer,
                tx.volunteer ? volNameById[tx.volunteer] : 'Аноним',
                tx.is_vegan !== null ? (tx.is_vegan ? 'Веган' : 'Мясоед') : '',
                mealTimeById[tx.meal_time],
                kitchenNameById[tx.kitchen],
                tx.amount,
                tx.reason
            ]);
        });
        void saveXLSX(workbook, 'feed-transactions');
    }, [kitchenNameById, volNameById]);

    const handleClickDownload = useCallback((): void => {
        void createAndSaveXLSX();
    }, [createAndSaveXLSX, foodData]);
    return (
        <div>
            <div className={styles.buttonsWrap}>
                <Button onClick={handleCreateClick}>
                    <PlusSquareOutlined />
                    {screenSize.width <= 576 ? 'Порцию' : 'Добавить порцию'}
                </Button>
                <div className={styles.createTableWrap}>
                    <span className={styles.resultDescr}>
                        <b>Результат:</b>
                        {` ${foodCount} порций`}
                    </span>
                    <Button type='primary' onClick={handleClickDownload}>
                        <VerticalAlignBottomOutlined />
                        Выгрузить в Excel
                    </Button>
                </div>
            </div>
            <Table columns={columns} dataSource={foodData} rowKey='ulid' />
        </div>
    );
}
