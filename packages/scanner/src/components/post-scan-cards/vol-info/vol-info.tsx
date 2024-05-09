import type { FC } from 'react';
import dayjs from 'dayjs';

import type { Volunteer } from '~/db';
import { Text } from '~/shared/ui/typography';

import css from './vol-info.module.css';

export const VolInfo: FC<{
    vol: Volunteer;
}> = ({ vol }) => {
    return (
        <div className={css.volInfo}>
            <Text className={css.text}>
                {vol.first_name} ({vol.name}), {vol.is_vegan ? 'Веган🥦' : 'Мясоед🥩'},{' '}
                {vol.departments.map((department) => department.name).join(', ')} (
                {new Date(dayjs(`${vol.active_from}`).unix()).toLocaleString('ru', {
                    day: 'numeric',
                    month: 'long'
                })}{' '}
                -{' '}
                {new Date(dayjs(`${vol.active_to}`).unix()).toLocaleString('ru', {
                    day: 'numeric',
                    month: 'long'
                })}
                )
            </Text>
        </div>
    );
};
