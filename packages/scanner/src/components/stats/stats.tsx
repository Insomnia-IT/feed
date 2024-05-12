import React, { useCallback, useEffect, useState } from 'react';

import { StatsTable } from '~/components/stats/stats-table';
import { useLocalStats } from '~/request-local-db';
import { getStatsDates } from '~/shared/lib/date';
import { Selector } from '~/shared/ui/selector/selector';

import css from './stats.module.css';

export enum StatsDateEnum {
    today = 'today',
    yesterday = 'yesterday',
    tomorrow = 'tomorrow'
}

export enum TableType {
    default = 'default',
    predict = 'predict'
}

export const Stats = React.memo(function Stats() {
    const { today, tomorrow, yesterday } = getStatsDates();
    const { error, progress, stats, update } = useLocalStats();
    const [selected, setSelected] = useState(StatsDateEnum.today);

    const [tableType, setTableType] = useState<TableType>(TableType.default);

    const updateStats = (statsDate): void => {
        if (statsDate === StatsDateEnum.today) {
            setTableType(TableType.default);
            void update(today);
        }
        if (statsDate === StatsDateEnum.yesterday) {
            setTableType(TableType.default);
            void update(yesterday);
        }
        if (statsDate === StatsDateEnum.tomorrow) {
            setTableType(TableType.predict);
            void update(tomorrow, true);
        }
    };
    useEffect(() => {
        updateStats(StatsDateEnum.today);
    }, []);

    const handleChangeDate = useCallback(
        (value) => {
            setSelected(value);
            updateStats(value);
        },
        [updateStats]
    );

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
                            { id: StatsDateEnum.yesterday, title: 'Вчера', subTitle: yesterday },
                            { id: StatsDateEnum.today, title: 'Сегодня', subTitle: today },
                            { id: StatsDateEnum.tomorrow, title: 'Завтра', subTitle: tomorrow }
                        ]}
                    />
                    <StatsTable stats={stats} tableType={tableType} progress={progress} />
                </>
            )}
        </div>
    );
});
