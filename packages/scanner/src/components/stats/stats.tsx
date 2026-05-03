import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { StatsTable } from 'components/stats/stats-table';
import { useLocalStats } from 'request-local-db';
import { getStatsDates } from 'shared/lib/date';
import { Selector } from 'shared/ui/selector/selector';

import css from './stats.module.css';

export const StatsDate = {
    today: 'today',
    yesterday: 'yesterday',
    tomorrow: 'tomorrow'
} as const;
export type StatsDate = (typeof StatsDate)[keyof typeof StatsDate];

export const TableType = {
    default: 'default',
    predict: 'predict'
} as const;
export type TableType = (typeof TableType)[keyof typeof TableType];

const getTableTypeByDate = (d: string): TableType => (d === StatsDate.tomorrow ? TableType.predict : TableType.default);

export const Stats = memo(function Stats() {
    const { today, tomorrow, yesterday } = getStatsDates();
    const { error, progress, stats, update } = useLocalStats();

    const [selected, setSelected] = useState<string>(StatsDate.today);

    const tableType = useMemo(() => getTableTypeByDate(selected), [selected]);

    const runUpdate = useCallback(
        (date: string) => {
            if (date === StatsDate.today) return update(today);
            if (date === StatsDate.yesterday) return update(yesterday);
            return update(tomorrow, true);
        },
        [today, yesterday, tomorrow, update]
    );

    useEffect(() => {
        void runUpdate(selected);
    }, [runUpdate, selected]);

    const handleChangeDate = useCallback((value: string) => {
        setSelected(value);
    }, []);

    return (
        <div className={css.stats}>
            {progress && !error && !stats && <span>Загрузка...</span>}
            {error && <span>Что-то пошло не так...</span>}
            {stats && !error && (
                <>
                    <Selector
                        onChangeSelected={handleChangeDate}
                        value={selected}
                        selectorList={[
                            { id: StatsDate.yesterday, title: 'Вчера', subTitle: yesterday },
                            { id: StatsDate.today, title: 'Сегодня', subTitle: today },
                            { id: StatsDate.tomorrow, title: 'Завтра', subTitle: tomorrow }
                        ]}
                    />
                    <StatsTable stats={stats} tableType={tableType} progress={progress} />
                </>
            )}
        </div>
    );
});
