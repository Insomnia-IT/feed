import type { FC } from 'react';

import type { Volunteer } from '~/db';
import { Text } from '~/shared/ui/typography';

import css from './vol-info.module.css';

const formatDate = (value) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long' });
};

export const VolInfo: FC<{
    vol: Volunteer;
}> = ({ vol }) => {
    return (
        <div className={css.volInfo}>
            <Text className={css.text}>
                {vol.first_name} ({vol.name}), {vol.is_vegan ? 'Веган🥦' : 'Мясоед🥩'},{' '}
                {vol.directions.map((direction) => direction.name).join(', ')} (
                {vol.arrivals
                    .map(({ arrival_date, departure_date }) =>
                        [arrival_date, departure_date].map(formatDate).join(' - ')
                    )
                    .join(', ')}
                )
            </Text>
        </div>
    );
};
