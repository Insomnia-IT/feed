import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Divider, Form, Radio, Space } from 'antd';
import type { RadioChangeEvent } from '@pankod/refine-antd';
import axios from 'axios';

import { NEW_API_URL } from '~/const';
import { dayjsExtended as dayjsExt, formDateFormat } from '~/shared/lib';

import type {
    EaterTypeExtended,
    IStatisticApi,
    IStatisticResponce,
    KitchenIdExtended,
    MealTime,
    StatisticType
} from '../types';
import {
    convertResponceToData,
    handleDataForColumnChart,
    handleDataForLinearChart,
    handleDataForTable
} from '../lib/handleData';

import type { ITableStatData } from './table-stats';
import TableStats from './table-stats';
import type { ILinearChartData } from './linear-chart';
import LinearChart from './linear-chart';
import { ColumnChart, IColumnChartData } from './column-chart';

type StatisticViewType = 'date' | 'range';

const { RangePicker } = DatePicker;

function convertDateToStringForApi(date: dayjsExt.Dayjs | null | undefined) {
    if (!date) {
        return dayjsExt().format('YYYY-MM-DD');
    }
    return date.format('YYYY-MM-DD');
}
function sordResponceByDate(a: IStatisticApi, b: IStatisticApi): 1 | -1 | 0 {
    if (dayjsExt(a.date).isAfter(b.date)) return 1;
    else return -1;
}

function PublicStatistic() {
    const [loading, setLoading] = useState(false);
    // Выбор отображения (таблица / графики)
    const [statisticViewType, setViewType] = useState<StatisticViewType>('date');
    const changeStatisticViewType = (e: RadioChangeEvent) => setViewType(e.target?.value);
    // Фильтр типа питания
    const [typeOfEater, setTypeOfEater] = useState<EaterTypeExtended>('all');
    const changeTypeOfEater = (e: RadioChangeEvent) => setTypeOfEater(e.target?.value);

    // Фильтр кухни
    const [kitchenId, setKitchenId] = useState<KitchenIdExtended>('all');
    const changeKitchenId = (e: RadioChangeEvent) => setKitchenId(e.target?.value);

    // Данные для дальнейшей обработки и отображения
    const [responce, setResponce] = useState<IStatisticResponce>([]);
    const data = convertResponceToData(responce);

    // Для выбора даты
    const [date, setDate] = useState<dayjsExt.Dayjs | null>(dayjsExt().startOf('date'));
    const changeDate = (value: dayjsExt.Dayjs | null, dateString: string) => {
        if (!value) {
            return setDate(dayjsExt());
        }
        setDate(value);
    };
    const changeDateByOneDay = useCallback((date: dayjsExt.Dayjs | null, direction: 'increment' | 'decrement') => {
        if (!date) {
            const today = dayjsExt();
            setDate(today);
        } else if (direction === 'increment') {
            setDate(date.add(1, 'day'));
        } else if (direction === 'decrement') {
            setDate(date.add(-1, 'day'));
        }
    }, []);
    const dateStr = convertDateToStringForApi(date);
    const prevDateStr = convertDateToStringForApi(date?.add(-1, 'day'));
    const nextDateStr = convertDateToStringForApi(date?.add(1, 'day'));

    // Для выбора диапазона дат для линейчатого графика
    const [timePeriod, setTimePeriod] = useState([
        dayjsExt().add(-1, 'day').startOf('date'),
        dayjsExt().add(1, 'day').startOf('date')
    ]);
    const changeTimePeriod = useCallback((range: Array<dayjsExt.Dayjs> | null) => {
        if (!range) return;
        setTimePeriod([dayjsExt(range[0]), dayjsExt(range[1])]);
    }, []);
    const startDatePeriodStr = convertDateToStringForApi(timePeriod[0]);
    const endDatePeriodStr = convertDateToStringForApi(timePeriod[1]);

    // Запрос данных с сервера
    let statsUrl = `${NEW_API_URL}/statistics/?date_from=${prevDateStr}&date_to=${nextDateStr}`;
    if (statisticViewType === 'range') {
        statsUrl = `${NEW_API_URL}/statistics/?date_from=${startDatePeriodStr}&date_to=${endDatePeriodStr}`;
    }

    const loadStats = async (url) => {
        setLoading(true);
        try {
            const res = await axios.get(url);
            const sortedResponce = res.data.sort(sordResponceByDate);

            const type = 'plan' as StatisticType;
            for (const date of new Set((sortedResponce as Array<{ date: string }>).map((stat) => stat.date))) {
                for (const meal_time of new Set(
                    (sortedResponce as Array<{ meal_time: Omit<MealTime, 'total'> }>).map((stat) => stat.meal_time)
                )) {
                    console.log(
                        `stat: type - ${type}, date - ${date}, meal_time - ${meal_time}:`,
                        (
                            sortedResponce as Array<{
                                type: StatisticType;
                                meal_time: Omit<MealTime, 'total'>;
                                date: string;
                            }>
                        ).filter((stat) => stat.type === type && stat.date === date && stat.meal_time === meal_time)
                    );
                }
            }
            setResponce(sortedResponce);
        } catch (error) {
            console.log('stat, plan:', `logging failed - ${error}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadStats(statsUrl);
    }, [statsUrl]);
    // Преобразование данных с сервера для таблицы и графиков
    const dataForTable: Array<ITableStatData> = useMemo(
        () => handleDataForTable(data, dateStr, typeOfEater, kitchenId),
        [responce, typeOfEater, kitchenId]
    );
    const { dataForAnnotation, dataForColumnChart } = useMemo(
        () => handleDataForColumnChart(data, typeOfEater, kitchenId),
        [responce, typeOfEater, kitchenId]
    );
    const dataForLinearChart: Array<ILinearChartData> = useMemo(
        () => handleDataForLinearChart(data, typeOfEater, kitchenId),
        [responce, typeOfEater, kitchenId]
    );

    return (
        <>
            <Form layout='inline'>
                <Form.Item>
                    <Radio.Group value={statisticViewType} onChange={changeStatisticViewType}>
                        <Radio.Button value='date'>На дату</Radio.Button>
                        <Radio.Button value='range'>Диапазон дат</Radio.Button>
                    </Radio.Group>
                </Form.Item>
            </Form>
            <Form layout='inline'>
                <Form.Item label='Тип людей по питанию'>
                    <Radio.Group value={typeOfEater} onChange={changeTypeOfEater}>
                        <Radio.Button value='all'>Все</Radio.Button>
                        <Radio.Button value='meatEater'>Мясоеды</Radio.Button>
                        <Radio.Button value='vegan'>Вегетерианцы</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label='Кухня'>
                    <Radio.Group value={kitchenId} onChange={changeKitchenId}>
                        <Radio.Button value='all'>Все</Radio.Button>
                        <Radio.Button value='first'>Первая</Radio.Button>
                        <Radio.Button value='second'>Вторая</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item>
                    {statisticViewType === 'date' ? (
                        <Space size={'small'}>
                            <Button onClick={() => changeDateByOneDay(date, 'decrement')}>{'<'}</Button>
                            <DatePicker value={date} onChange={changeDate} format={formDateFormat} allowClear={false} />
                            <Button onClick={() => changeDateByOneDay(date, 'increment')}>{'>'}</Button>
                        </Space>
                    ) : (
                        <RangePicker
                            format={formDateFormat}
                            onChange={(range) => changeTimePeriod(range as Array<dayjsExt.Dayjs>)}
                        />
                    )}
                </Form.Item>
            </Form>
            {statisticViewType === 'date' ? (
                <>
                    <TableStats data={dataForTable} loading={loading} />
                    <Divider />
                    <ColumnChart columnDataArr={dataForColumnChart} dataForAnnotation={dataForAnnotation} />
                </>
            ) : (
                <LinearChart linearChartData={dataForLinearChart} />
            )}
        </>
    );
}
export { PublicStatistic };
