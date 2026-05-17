import { useTodayMealStats } from 'shared/hooks/use-today-meal-stats';

import style from './main-screen-stats.module.css';

export const ScanScreenStats = () => {
    const { individualFedCount, individualLeftCount } = useTodayMealStats();

    return (
        <div className={style.mainScreenStats}>
            <span>Покормлено: {individualFedCount}</span>
            <span>Осталось: {individualLeftCount}</span>
        </div>
    );
};
