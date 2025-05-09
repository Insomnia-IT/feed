import type { FC } from 'react';
import dayjs from 'dayjs';

import type { Arrival, Volunteer } from '~/db';
import { Text } from '~/shared/ui/typography';

import css from './vol-info.module.css';

const formatDate = (value): string => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long' });
};

const today = dayjs();

// Поиск приоритетного заезда для показа: Надо выбрать тот заезд, в который входит «сегодня». Если такого нет, выбрать ближайший (прошлый или будущий). И только в текущем году
const findTargetArrivalDates = (arrivals: Array<Arrival>): Arrival | undefined => {
    let targetArrival: Arrival | undefined;
    let isInside = false;

    arrivals.forEach((arrival) => {
        if (isInside) {
            return;
        }

        const start = dayjs(arrival.arrival_date);
        const end = dayjs(arrival.departure_date);

        // Другой год - пропускаем сразу
        if (!start.isSame(today, 'year')) {
            return;
        }

        // Сегодня попадает в дату заезда/отъезда или между ними
        if (start.isSame(today, 'date') || end.isSame(today, 'date') || (start.isBefore(today) && end.isAfter(today))) {
            targetArrival = arrival;
            isInside = true;

            return;
        }

        // Нет никакого целевого заезда - присваиваем текущий заезд.
        if (!targetArrival) {
            targetArrival = arrival;
            return;
        }

        const targetArrivalStart = dayjs(targetArrival.arrival_date);
        const targetArrivalEnd = dayjs(targetArrival.departure_date);

        // Если дата старта текущего заезда ближе к сегодня - считаем его целевым.
        if (today.diff(targetArrivalEnd) > today.diff(start) && today.diff(targetArrivalStart) > today.diff(start)) {
            targetArrival = arrival;
        }
    });

    return targetArrival;
};

export const VolInfo: FC<{
    vol: Volunteer;
}> = ({ vol }) => {
    const targetArrival = findTargetArrivalDates(vol.arrivals);
    const arrivalDatesText = targetArrival
        ? [targetArrival.arrival_date, targetArrival.departure_date].map(formatDate).join(' - ')
        : undefined;

    return (
        <div className={css.volInfo}>
            <Text className={css.text}>
                {vol.first_name} ({vol.name}), {vol.is_vegan ? 'Веган🥦' : 'Мясоед🥩'},{' '}
                {vol.directions.map((direction) => direction.name).join(', ')} {arrivalDatesText}
            </Text>
        </div>
    );
};
