import type { FC } from 'react';
import dayjs from 'dayjs';

import type { Volunteer } from '~/db';
import { FeedType } from '~/db';
import css from '~/components/misc/misc.module.css';

const dateTimeFormat = 'DD MMM HH:mm';

export const VolInfo: FC<{
    vol: Volunteer;
}> = ({ vol: { active_from, active_to, departments, feed_type, first_name, is_vegan, name } }) => (
    <div className={css.volInfo}>
        <div className={css.feedType}>
            {feed_type === FeedType.FT2 ? 'платно' : feed_type === FeedType.Child ? 'ребенок' : 'фри'}
        </div>
        <div>{is_vegan ? 'веган' : 'мясоед'}</div>
        <div>
            <span>
                {first_name} ({name})
            </span>
        </div>
        <div className={css.volDates}>
            {active_from && <span>{`c ${dayjs(active_from).format(dateTimeFormat)}`}</span>}
            {active_to && <span>{`по ${dayjs(active_to).format(dateTimeFormat)}`}</span>}
        </div>
        <div className={css.misc}>
            {departments && departments.length > 0 && (
                <div>Службы: {departments.map(({ name }) => name).join(', ')}</div>
            )}
        </div>
    </div>
);
