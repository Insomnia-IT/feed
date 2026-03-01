import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Radio, type RadioChangeEvent, Space, Spin, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import { dayjsExtended as dayjsExt, formDateFormat } from 'shared/lib';
import type {
    BooleanExtended,
    EaterTypeExtended,
    IStatisticApi,
    IStatisticResponse,
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
const { Text } = Typography;

const ColumnChart = lazy(() => import('./column-chart'));
const LinearChart = lazy(() => import('./linear-chart'));

const toApiDate = (date: dayjsExt.Dayjs | null | undefined) => (date ? date.format('YYYY-MM-DD') : '');

const sortByDate = (a: IStatisticApi, b: IStatisticApi) => {
    const da = dayjsExt(a.date);
    const db = dayjsExt(b.date);
    if (da.isBefore(db)) return -1;
    if (da.isAfter(db)) return 1;
    return 0;
};

type FiltersState = {
    typeOfEater: EaterTypeExtended;
    kitchenId: KitchenIdExtended;
    anonymous: BooleanExtended;
    groupBadge: BooleanExtended;
    predictionAlg: PredictionAlg;
    applyHistory: BooleanExtended;
    selectedMealTime: MealTime;
};

const DEFAULT_FILTERS: FiltersState = {
    typeOfEater: 'all',
    kitchenId: 'all',
    anonymous: 'all',
    groupBadge: 'all',
    predictionAlg: '1',
    applyHistory: 'false',
    selectedMealTime: 'breakfast'
};

type FilterCardProps = {
    label: string;
    children: React.ReactNode;
    className?: string;
};

const FilterCard = ({ label, children, className }: FilterCardProps) => (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
        <Text type="secondary" className={styles.cardLabel}>
            {label}
        </Text>
        {children}
    </div>
);

export function PublicStatistic() {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<IStatisticResponse>([]);

    const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

    const [statisticViewType, setStatisticViewType] = useState<StatisticViewType>('date');
    const [date, setDate] = useState<dayjsExt.Dayjs>(dayjsExt().startOf('date'));
    const [timePeriod, setTimePeriod] = useState<[dayjsExt.Dayjs | null, dayjsExt.Dayjs | null]>([
        dayjsExt().add(-1, 'day').startOf('date'),
        dayjsExt().add(1, 'day').startOf('date')
    ]);

    const handleFilterChange = useCallback(
        (key: keyof FiltersState) => (e: RadioChangeEvent) => {
            const value = e.target.value as FiltersState[typeof key];
            setFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
        },
        []
    );

    const changeDateByOneDay = useCallback((direction: 'increment' | 'decrement') => {
        setDate((d) => (direction === 'increment' ? d.add(1, 'day') : d.add(-1, 'day')));
    }, []);

    const { dateStr, dateFrom, dateTo } = useMemo(() => {
        const dateStr = toApiDate(date);

        if (statisticViewType === 'range') {
            const [start, end] = timePeriod;

            const safeStart = start ?? date.add(-1, 'day').startOf('date');
            const safeEnd = end ?? date.add(1, 'day').startOf('date');

            return {
                dateStr,
                dateFrom: toApiDate(safeStart),
                dateTo: toApiDate(safeEnd)
            };
        }

        const prev = date.add(-1, 'day');
        const next = date.add(1, 'day');

        return {
            dateStr,
            dateFrom: toApiDate(prev),
            dateTo: toApiDate(next)
        };
    }, [date, statisticViewType, timePeriod]);

    const apiParams = useMemo(() => {
        return {
            date_from: dateFrom,
            date_to: dateTo,
            anonymous: filters.anonymous !== 'all' ? filters.anonymous : undefined,
            group_badge: filters.groupBadge !== 'all' ? filters.groupBadge : undefined,
            prediction_alg: filters.predictionAlg,
            apply_history: filters.applyHistory
        };
    }, [dateFrom, dateTo, filters.anonymous, filters.groupBadge, filters.predictionAlg, filters.applyHistory]);

    useEffect(() => {
        const controller = new AbortController();

        const loadStats = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${NEW_API_URL}/statistics/`, {
                    params: apiParams,
                    signal: controller.signal
                });

                const sorted = (res.data as IStatisticResponse).slice().sort(sortByDate);
                setResponse(sorted);
            } catch (error: unknown) {
                if (controller.signal.aborted) return;
                console.error('Failed to load stats:', error);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        loadStats();

        return () => controller.abort();
    }, [apiParams]);

    const data = useMemo(() => convertResponceToData(response), [response]);
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

    return (
        <div className={styles.layout}>
            <div className={styles.row}>
                <Radio.Group
                    value={statisticViewType}
                    onChange={(e) => setStatisticViewType(e.target.value as StatisticViewType)}
                >
                    <Radio.Button value="date">На дату</Radio.Button>
                    <Radio.Button value="range">Диапазон дат</Radio.Button>
                </Radio.Group>

                {statisticViewType === 'date' ? (
                    <Space size="small" wrap>
                        <Button onClick={() => changeDateByOneDay('decrement')} aria-label="Предыдущий день">
                            {'<'}
                        </Button>
                        <DatePicker
                            value={date}
                            onChange={(d) => d && setDate(d)}
                            format={formDateFormat}
                            allowClear={false}
                        />
                        <Button onClick={() => changeDateByOneDay('increment')} aria-label="Следующий день">
                            {'>'}
                        </Button>
                    </Space>
                ) : (
                    <RangePicker
                        value={timePeriod}
                        onChange={(val) => {
                            if (!val) return;
                            setTimePeriod([val[0], val[1]]);
                        }}
                        format={formDateFormat}
                    />
                )}
            </div>

            <div className={styles.filtersGrid}>
                <FilterCard label="Тип людей по питанию">
                    <Radio.Group value={filters.typeOfEater} onChange={handleFilterChange('typeOfEater')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="meatEater">Мясоеды</Radio.Button>
                        <Radio.Button value="vegan">Вегетарианцы</Radio.Button>
                    </Radio.Group>
                </FilterCard>

                <FilterCard label="Кухня">
                    <Radio.Group value={filters.kitchenId} onChange={handleFilterChange('kitchenId')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="1">№1</Radio.Button>
                        <Radio.Button value="2">№2</Radio.Button>
                        <Radio.Button value="3">№3</Radio.Button>
                    </Radio.Group>
                </FilterCard>

                <FilterCard label="Аноним">
                    <Radio.Group value={filters.anonymous} onChange={handleFilterChange('anonymous')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="true">Да</Radio.Button>
                        <Radio.Button value="false">Нет</Radio.Button>
                    </Radio.Group>
                </FilterCard>

                <FilterCard label="Групповой бейдж">
                    <Radio.Group value={filters.groupBadge} onChange={handleFilterChange('groupBadge')}>
                        <Radio.Button value="all">Все</Radio.Button>
                        <Radio.Button value="true">Да</Radio.Button>
                        <Radio.Button value="false">Нет</Radio.Button>
                    </Radio.Group>
                </FilterCard>

                <FilterCard label="Алгоритм прогноза">
                    <Radio.Group value={filters.predictionAlg} onChange={handleFilterChange('predictionAlg')}>
                        <Radio.Button value="1" className={styles.radioWithIcon}>
                            Первый{' '}
                            <Tooltip
                                title={() => (
                                    <div className={styles.tooltip}>
                                        ФАКТ(вчера или позавчера) / SQRT(НА_ПОЛЕ(вчера или позавчера)) *<br />
                                        SQRT(НА_ПОЛЕ(сегодня))
                                        <br />
                                        выбирается позавчера, если НА_ПОЛЕ растет, а ФАКТ падает
                                    </div>
                                )}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Radio.Button>

                        <Radio.Button value="2" className={styles.radioWithIcon}>
                            Второй{' '}
                            <Tooltip
                                title={() => (
                                    <div className={styles.tooltip}>
                                        ФАКТ(вчера или позавчера) / SQRT(НА_ПОЛЕ(вчера или позавчера)) *
                                        SQRT(НА_ПОЛЕ(сегодня))
                                        <br />
                                        выбирается позавчера, если вчера была сильная просадка
                                    </div>
                                )}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Radio.Button>

                        <Radio.Button value="3" className={styles.radioWithIcon}>
                            Третий{' '}
                            <Tooltip
                                title={() => (
                                    <div className={styles.tooltip}>
                                        ФАКТ(вчера) / НА_ПОЛЕ(вчера) * НА_ПОЛЕ(сегодня)
                                        <br />
                                        формула прошлого года
                                    </div>
                                )}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Radio.Button>
                    </Radio.Group>
                </FilterCard>

                <FilterCard label="Применить историю">
                    <Radio.Group value={filters.applyHistory} onChange={handleFilterChange('applyHistory')}>
                        <Radio.Button value="true">Да</Radio.Button>
                        <Radio.Button value="false">Нет</Radio.Button>
                    </Radio.Group>
                </FilterCard>
            </div>

            {statisticViewType === 'date' && <TableStats data={dataForTable} loading={loading} />}

            <div className={styles.row}>
                <Text type="secondary" className={styles.inlineLabel}>
                    Выберите приём пищи:
                </Text>
                <Radio.Group
                    value={filters.selectedMealTime}
                    onChange={handleFilterChange('selectedMealTime')}
                    disabled={statisticViewType !== 'date'}
                >
                    <Radio.Button value="breakfast">Завтрак</Radio.Button>
                    <Radio.Button value="lunch">Обед</Radio.Button>
                    <Radio.Button value="dinner">Ужин</Radio.Button>
                    <Radio.Button value="night">Дожор</Radio.Button>
                </Radio.Group>
            </div>

            <Suspense fallback={<Spin className={styles.loading} />}>
                {statisticViewType === 'date' ? (
                    <ColumnChart data={dataForColumnChart} mealTime={filters.selectedMealTime} />
                ) : (
                    <LinearChart data={dataForLinearChart} />
                )}
            </Suspense>
        </div>
    );
}
