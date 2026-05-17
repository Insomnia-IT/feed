import { useTodayMealStats } from 'shared/hooks/use-today-meal-stats';

import style from './main-screen-stats.module.css';

export const ScanScreenStats = ({ isAfterScan = false }: { isAfterScan?: boolean }) => {
    const { lastSyncStart, volsOnFieldCount, individualFedCount, individualLeftCount, groupFedCount, groupLeftCount } =
        useTodayMealStats();

    return (
        <div>
            <div className={isAfterScan ? style.mainScreenStatsAfterScan : style.mainScreenStats}>
                {isAfterScan && <span>На поле: {volsOnFieldCount}</span>}
                <span>Покормлено: {individualFedCount}</span>
                <span>Осталось: {individualLeftCount}</span>
            </div>
            <div className={isAfterScan ? style.mainScreenStatsAfterScan : style.mainScreenStats}>
                <span>Покормлено по ГБ: {groupFedCount}</span>
                <span>Осталось по ГБ: {groupLeftCount}</span>
            </div>
            {isAfterScan && !!lastSyncStart && <p>Обновилось: {formatDate(lastSyncStart)}</p>}
        </div>
    );
};

const formatDate = (value: number) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' });
};
