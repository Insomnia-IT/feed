import React, { useContext, useEffect, useState } from 'react';

import { StatsTable } from '~/components/stats/stats-table';
import { useLocalStats } from '~/request-local-db';
import { getStatsDates } from '~/shared/lib/date';
import { ViewContext } from '~/view-context';
import { StatsDatePicker } from '~/components/stats/stats-date-picker';

import style from './stats.module.css';

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
    const { currentView } = useContext(ViewContext);

    const [tableType, setTableType] = useState<TableType>(TableType.default);
    const [statsDate, setStatsDate] = useState<StatsDateEnum>(StatsDateEnum.today);
    const [formattedDate, setFormattedDate] = useState<string>(today);

    useEffect(() => {
        if (currentView === 2) {
            updateStats();
        }
    }, [currentView, formattedDate]);

    useEffect(() => {
        if (statsDate === StatsDateEnum.today) {
            setTableType(TableType.default);
            setFormattedDate(today);
        }
        if (statsDate === StatsDateEnum.yesterday) {
            setTableType(TableType.default);
            setFormattedDate(yesterday);
        }
        if (statsDate === StatsDateEnum.tomorrow) {
            setTableType(TableType.predict);
            setFormattedDate(tomorrow);
        }
    }, [statsDate]);

    const updateStats = (): void => {
        if (tableType === TableType.default) {
            void update(formattedDate);
        } else {
            void update(formattedDate, true);
        }
    };

    return (
        <>
            {progress && !error && !stats && (
                <div className={style.msg}>
                    <span>Загрузка...</span>
                </div>
            )}
            {error && (
                <div className={style.msg}>
                    <span>Что-то пошло не так...</span>
                </div>
            )}
            {stats && !error && (
                <>
                    <StatsTable stats={stats} tableType={tableType} progress={progress} />
                    <div className={style.statsInfoWrapper}>
                        <div className={style.info}>
                            <span className={style.meat}>мясоедов</span>/<span className={style.vegan}>веганов</span>
                        </div>
                        <StatsDatePicker
                            formattedDate={formattedDate}
                            statsDate={statsDate}
                            setStatsDate={setStatsDate}
                            progress={progress}
                        />
                    </div>
                </>
            )}
        </>
    );
});
