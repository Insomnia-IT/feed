import cn from 'classnames';

import { useTodayMealStats } from 'shared/hooks/use-today-meal-stats';

import css from './vol-and-update-info.module.css';

const formatDate = (value: number) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' });
};

export const VolAndUpdateInfo = ({ textColor = 'black' }: { textColor?: 'black' | 'white' }) => {
    const { lastSyncStart, volsOnField, volsFedAmount, volsLeftAmount } = useTodayMealStats();

    return (
        <div className={cn(css.postScanStats, { [css[textColor]]: textColor })}>
            <div className={css.stats}>
                <p>На поле: {volsOnField}</p>
                <p>Покормлено: {volsFedAmount}</p>
                <p>Осталось: {volsLeftAmount}</p>
            </div>
            {!!lastSyncStart && <p>Обновилось: {formatDate(lastSyncStart)}</p>}
        </div>
    );
};
