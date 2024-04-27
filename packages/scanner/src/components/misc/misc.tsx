import dayjs from 'dayjs';
import type { FC } from 'react';

import type { Volunteer } from '~/db';

import css from './misc.module.css';

const dateTimeFormat = 'DD MMM HH:mm';

export type ValueOf<T> = T[keyof T];

export const isVolExpired = (vol: Volunteer): boolean => {
    return (
        !vol.active_to ||
        !vol.active_from ||
        dayjs() < dayjs(vol.active_from).startOf('day').add(7, 'hours') ||
        dayjs() > dayjs(vol.active_to).endOf('day').add(7, 'hours')
    );
};

export const LastUpdated: FC<{
    ts: number;
    count: number;
}> = ({ count, ts }) => (
    <div className={css.lastUpdated}>{`Обновлено: ${dayjs(ts).format(dateTimeFormat)} (${count})`}</div>
);
