import cn from 'classnames';

import { ScreenHeader } from '~/components/screen-header';

import css from '../app/app.module.css';
import { Stats } from '../components/stats';

export const StatsScreen = () => {
    return (
        <div className={cn(css.screen, css.stats)}>
            <ScreenHeader>Статистика</ScreenHeader>
            <Stats />
        </div>
    );
};
