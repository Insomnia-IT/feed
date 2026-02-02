import dayjs from 'dayjs';

import type { Arrival, Volunteer } from 'db';
import { Text } from 'shared/ui/typography';

import css from './vol-info.module.css';

const today = dayjs();

// Поиск приоритетного заезда для показа: Надо выбрать тот заезд, в который входит «сегодня». Если такого нет, выбрать ближайший (прошлый или будущий). И только в текущем году
const calculateTargetArrivalDatesText = (arrivals: Array<Arrival>): string => {
    let targetDates: { start: ReturnType<typeof dayjs>; end: ReturnType<typeof dayjs> } | undefined;

    for (const arrival of arrivals) {
        const start = dayjs(arrival.arrival_date);
        const end = dayjs(arrival.departure_date);

        // Другой год - пропускаем сразу
        if (!start.isSame(today, 'year')) {
            continue;
        }

        // Сегодня попадает в дату заезда/отъезда или между ними
        if (start.isSame(today, 'date') || end.isSame(today, 'date') || (start.isBefore(today) && end.isAfter(today))) {
            targetDates = { start, end };

            break;
        }

        // Нет никакого целевого заезда - присваиваем текущий заезд.
        if (!targetDates) {
            targetDates = { start, end };
            continue;
        }

        const targetArrivalStart = targetDates.start;
        const targetArrivalEnd = targetDates.end;

        // Если дата старта текущего заезда ближе к сегодня - считаем его целевым.
        if (
            Math.abs(today.diff(targetArrivalEnd)) > Math.abs(today.diff(start)) &&
            Math.abs(today.diff(targetArrivalStart)) > Math.abs(today.diff(start))
        ) {
            targetDates = { start, end };
        }
    }

    if (!targetDates) {
        return '(не найдены даты заезда)';
    }

    return `(${targetDates.start.format('DD MMMM')} - ${targetDates.end.format('DD MMMM')})`;
};

export const VolInfo = ({ vol }: { vol: Volunteer }) => {
    const { arrivals, directions, first_name, name } = vol;

    const feedTypeText = vol.is_vegan ? 'Веган🥦' : 'Мясоед🥩';
    const directionsText = directions.map((direction) => direction.name).join(', ');
    const arrivalDatesText = calculateTargetArrivalDatesText(arrivals);

    return (
        <div className={css.volInfo}>
            <Text className={css.text}>
                {first_name} ({name}), {feedTypeText}, {directionsText} {arrivalDatesText}
            </Text>
        </div>
    );
};
