import { Button } from 'shared/ui/button';
import { VolAndUpdateInfo } from 'components/vol-and-update-info';
import { AppViews, useView } from 'model/view-provider';

import css from './stats-block.module.css';

export const StatsBlock = () => {
    const { setCurrentView } = useView();
    return (
        <div className={css.statsBlock}>
            <Button
                variant="secondary"
                className={css.statsButton}
                onClick={() => {
                    setCurrentView(AppViews.STATS);
                }}
            >
                Статистика кормлений
            </Button>
            <Button
                variant="secondary"
                className={css.statsButton}
                onClick={() => {
                    setCurrentView(AppViews.GROUP_BADGE_PLAN);
                }}
            >
                План по групповым бейджам
            </Button>
            <VolAndUpdateInfo />
        </div>
    );
};
