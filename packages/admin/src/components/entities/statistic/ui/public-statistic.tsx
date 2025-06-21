import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Radio, RadioChangeEvent, Space, Spin, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import { dayjsExtended as dayjsExt, formDateFormat } from 'shared/lib';

import type {
    BooleanExtended,
    EaterTypeExtended,
    IStatisticApi,
    IStatisticResponce,
    KitchenIdExtended,
    MealTime,
    PredictionAlg
} from '../types';
import {
    convertResponceToData,
    handleDataForColumnChart,
    handleDataForLinearChart,
    handleDataForTable
} from '../lib/handleData';

import TableStats from './table-stats';

import styles from './public-statistic.module.css';

type StatisticViewType = 'date' | 'range';
const { RangePicker } = DatePicker;

const ColumnChart = lazy(() => import('./column-chart'));
const LinearChart = lazy(() => import('./linear-chart'));

const convertDateToStringForApi = (date: dayjsExt.Dayjs | null = dayjsExt()) => date?.format('YYYY-MM-DD') || '';

const sortByDate = (a: IStatisticApi, b: IStatisticApi): 1 | -1 => (dayjsExt(a.date).isAfter(b.date) ? 1 : -1);

export function PublicStatistic() {
    const [loading, setLoading] = useState(false);
    const [responce, setResponce] = useState<IStatisticResponce>([]);

    const [filters, setFilters] = useState({
        typeOfEater: 'all' as EaterTypeExtended,
        kitchenId: 'all' as KitchenIdExtended,
        anonymous: 'all' as BooleanExtended,
        groupBadge: 'all' as BooleanExtended,
        predictionAlg: '1' as PredictionAlg,
        applyHistory: 'false' as BooleanExtended,
        selectedMealTime: 'breakfast' as MealTime
    });

    const [statisticViewType, setStatisticViewType] = useState<StatisticViewType>('date');
    const [date, setDate] = useState<dayjsExt.Dayjs>(dayjsExt().startOf('date'));
    const [timePeriod, setTimePeriod] = useState<[dayjsExt.Dayjs | null, dayjsExt.Dayjs | null]>([
        dayjsExt().add(-1, 'day').startOf('date'),
        dayjsExt().add(1, 'day').startOf('date')
    ]);

    const handleFilterChange = useCallback(
        (key: keyof typeof filters) => (e: RadioChangeEvent) => {
            setFilters((prev) => ({ ...prev, [key]: e.target.value }));
        },
        []
    );

    const { dateStr, prevDateStr, nextDateStr } = useMemo(() => {
        const dateStr = convertDateToStringForApi(date);
        return {
            dateStr,
            prevDateStr: convertDateToStringForApi(date.add(-1, 'day')),
            nextDateStr: convertDateToStringForApi(date.add(1, 'day'))
        };
    }, [date]);

    const { startDateStr, endDateStr } = useMemo(
        () => ({
            startDateStr: convertDateToStringForApi(timePeriod[0]),
            endDateStr: convertDateToStringForApi(timePeriod[1])
        }),
        [timePeriod]
    );

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const date_from = statisticViewType === 'range' ? startDateStr : prevDateStr;
            const date_to = statisticViewType === 'range' ? endDateStr : nextDateStr;

            const res = await axios.get(`${NEW_API_URL}/statistics/`, {
                params: {
                    date_from,
                    date_to,
                    anonymous: filters.anonymous !== 'all' ? filters.anonymous : undefined,
                    group_badge: filters.groupBadge !== 'all' ? filters.groupBadge : undefined,
                    prediction_alg: filters.predictionAlg,
                    apply_history: filters.applyHistory
                }
            });

            setResponce(res.data.sort(sortByDate));
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    }, [
        statisticViewType,
        prevDateStr,
        nextDateStr,
        startDateStr,
        endDateStr,
        filters.anonymous,
        filters.groupBadge,
        filters.predictionAlg,
        filters.applyHistory
    ]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const data = useMemo(() => convertResponceToData(responce), [responce]);
    const dataForTable = useMemo(
        () => handleDataForTable(data, dateStr, filters.typeOfEater, filters.kitchenId),
        [data, dateStr, filters.typeOfEater, filters.kitchenId]
    );
    const dataForColumnChart = useMemo(
        () => handleDataForColumnChart(data, filters.typeOfEater, filters.kitchenId, filters.selectedMealTime),
        [data, filters.typeOfEater, filters.kitchenId, filters.selectedMealTime]
    );
    const dataForLinearChart = useMemo(
        () => handleDataForLinearChart(data, filters.typeOfEater, filters.kitchenId, filters.selectedMealTime),
        [data, filters.typeOfEater, filters.kitchenId, filters.selectedMealTime]
    );

    const changeDateByOneDay = useCallback(
        (direction: 'increment' | 'decrement') =>
            setDate((d) => (direction === 'increment' ? d.add(1, 'day') : d.add(-1, 'day'))),
        []
    );

    return (
        <Form layout="vertical" className={styles.layout}>
            <Form layout="inline">
                <Form.Item>
                    <Radio.Group
                        value={statisticViewType}
                        onChange={(e) => setStatisticViewType(e.target.value as StatisticViewType)}
                    >
                        <Radio.Button value="date">На дату</Radio.Button>
                        <Radio.Button value="range">Диапазон дат</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item>
                    {statisticViewType === 'date' ? (
                        <Space size="small">
                            <Button onClick={() => changeDateByOneDay('decrement')}>{'<'}</Button>
                            <DatePicker
                                value={date}
                                onChange={(d) => d && setDate(d)}
                                format={formDateFormat}
                                allowClear={false}
                            />
                            <Button onClick={() => changeDateByOneDay('increment')}>{'>'}</Button>
                        </Space>
                    ) : (
                        <RangePicker
                            value={timePeriod}
                            onChange={(val) => val && setTimePeriod([val[0], val[1]])}
                            format={formDateFormat}
                        />
                    )}
                </Form.Item>
            </Form>
            <Form layout="inline">
                <Form.Item label="Тип людей по питанию">
                    <Radio.Group value={filters.typeOfEater} onChange={handleFilterChange('typeOfEater')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="meatEater">Мясоеды</Radio.Button>
                        <Radio.Button value="vegan">Вегетарианцы</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="Кухня">
                    <Radio.Group value={filters.kitchenId} onChange={handleFilterChange('kitchenId')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="1">№1</Radio.Button>
                        <Radio.Button value="2">№2</Radio.Button>
                        <Radio.Button value="3">№3</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="Аноним">
                    <Radio.Group value={filters.anonymous} onChange={handleFilterChange('anonymous')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="true">Да</Radio.Button>
                        <Radio.Button value="false">Нет</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label="Групповой бейдж">
                    <Radio.Group value={filters.groupBadge} onChange={handleFilterChange('groupBadge')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="true">Да</Radio.Button>
                        <Radio.Button value="false">Нет</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="Алгоритм прогноза">
                    <Radio.Group value={filters.predictionAlg} onChange={handleFilterChange('predictionAlg')}>
                        <Radio.Button value="1">
                            Первый{' '}
                            <Tooltip
                                title={() => (
                                    <>
                                        ФАКТ(вчера или позавчера) / SQRT(НА_ПОЛЕ(вчера или позавчера)) *<br />
                                        SQRT(НА_ПОЛЕ(сегодня))
                                        <br />
                                        выбирается позавчера, если НА_ПОЛЕ растет, а ФАКТ падает
                                    </>
                                )}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Radio.Button>
                        <Radio.Button value="2">
                            Второй{' '}
                            <Tooltip
                                title={() => (
                                    <>
                                        ФАКТ(вчера или позавчера) / SQRT(НА_ПОЛЕ(вчера или позавчера)) *
                                        SQRT(НА_ПОЛЕ(сегодня))
                                        <br />
                                        выбирается позавчера, если вчера была сильная просадка
                                    </>
                                )}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Radio.Button>
                        <Radio.Button value="3">
                            Третий{' '}
                            <Tooltip
                                title={() => (
                                    <>
                                        ФАКТ(вчера) / НА_ПОЛЕ(вчера) * НА_ПОЛЕ(сегодня)
                                        <br />
                                        формула прошлого года
                                    </>
                                )}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="Применить историю">
                    <Radio.Group value={filters.applyHistory} onChange={handleFilterChange('applyHistory')}>
                        <Radio.Button value="true">Да</Radio.Button>
                        <Radio.Button value="false">Нет</Radio.Button>
                    </Radio.Group>
                </Form.Item>
            </Form>

            {statisticViewType === 'date' && <TableStats data={dataForTable} loading={loading} />}
            <Form layout="inline" style={{ marginBottom: 16 }}>
                <Form.Item label="Выберите приём пищи:">
                    <Radio.Group value={filters.selectedMealTime} onChange={handleFilterChange('selectedMealTime')}>
                        <Radio.Button value="breakfast">Завтрак</Radio.Button>
                        <Radio.Button value="lunch">Обед</Radio.Button>
                        <Radio.Button value="dinner">Ужин</Radio.Button>
                        <Radio.Button value="night">Дожор</Radio.Button>
                    </Radio.Group>
                </Form.Item>
            </Form>

            <Suspense fallback={<Spin style={{ display: 'block', margin: '20px auto' }} />}>
                {statisticViewType === 'date' ? (
                    <ColumnChart data={dataForColumnChart} mealTime={filters.selectedMealTime} />
                ) : (
                    <LinearChart data={dataForLinearChart} />
                )}
            </Suspense>
        </Form>
    );
}
