import { useTodayMealStats } from 'shared/hooks/use-today-meal-stats';

import style from './main-screen-stats.module.css';

export const ScanScreenStats = () => {
    const { volsFedAmount, volsLeftAmount } = useTodayMealStats();

    return (
        <div className={style.mainScreenStats}>
            <span>Покормлено: {volsFedAmount}</span>
            <span>Осталось: {volsLeftAmount}</span>
        </div>
    );
};
