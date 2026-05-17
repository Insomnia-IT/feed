import cn from 'classnames';

import { useTodayMealStats } from 'shared/hooks/use-today-meal-stats';

import css from './vol-and-update-info.module.css';

type TextColor = 'black' | 'white';

const colorClassName: Record<TextColor, string> = {
    black: css.black,
    white: css.white
};

const formatDate = (value: number) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' });
};

export const VolAndUpdateInfo = ({ textColor = 'black' }: { textColor?: TextColor }) => {
    const { lastSyncStart, volsOnField, volsFedAmount, volsLeftAmount } = useTodayMealStats();

    return (
        <div className={cn(css.postScanStats, colorClassName[textColor])}>
            <div className={css.stats}>
                <p>На поле: {volsOnField}</p>
                <p>Покормлено: {volsFedAmount}</p>
                <p>Осталось: {volsLeftAmount}</p>
            </div>
            {!!lastSyncStart && <p>Обновилось: {formatDate(lastSyncStart)}</p>}
        </div>
    );
};
