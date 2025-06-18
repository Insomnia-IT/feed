import type { ArrivalEntity, VolEntity } from 'interfaces';
import dayjs, { Dayjs } from 'dayjs';

export function findTargetArrival(vol: VolEntity): ArrivalEntity | undefined {
    const arrivals = vol?.arrivals;

    if (!arrivals) {
        return undefined;
    }

    return arrivals.find((item) => {
        return dayjs(item.departure_date).endOf('day').isAfter(dayjs().startOf('day'));
    });
}

export const canBeVolunteerArrivalChanged = (
    volunteer: VolEntity,
    date?: Dayjs,
    dateType?: 'start' | 'end'
): boolean => {
    const currentArrival = findTargetArrival(volunteer);
    return date && currentArrival
        ? // Новая дата заезда не может быть больше текущей даты отъезда
          (dateType === 'start' && date > dayjs(currentArrival.departure_date)) ||
              // Новая дата отъезда не может быть меньше текущей даты заезда
              (date && dateType === 'end' && date < dayjs(currentArrival.arrival_date))
        : false;
};
