import dayjs from 'dayjs';

import type { ArrivalEntity, VolEntity } from 'interfaces';
import { isActivatedStatus } from 'shared/lib';

import type { FilterField } from './filter-types';

export const getOnFieldColors = (vol: VolEntity): 'green' | 'red' | undefined => {
    const day = dayjs();
    const currentArrival = findClosestArrival(vol.arrivals);
    const currentArrivalArray: Array<ArrivalEntity> = [];
    if (currentArrival !== null) {
        currentArrivalArray.push(currentArrival);
    }

    if (
        currentArrivalArray.some(
            ({ arrival_date, departure_date, status }) =>
                isActivatedStatus(status) &&
                day >= dayjs(arrival_date).startOf('day').add(7, 'hours') &&
                day <= dayjs(departure_date).endOf('day').add(7, 'hours')
        )
    ) {
        return 'green';
    }

    if (
        currentArrivalArray.some(
            ({ arrival_date, departure_date, status }) =>
                !isActivatedStatus(status) &&
                day >= dayjs(arrival_date).startOf('day').add(7, 'hours') &&
                day <= dayjs(departure_date).endOf('day').add(7, 'hours')
        )
    ) {
        return 'red';
    }
};

export function findClosestArrival(arrivals: Array<ArrivalEntity>): ArrivalEntity | null {
    const now = dayjs();
    let closestFutureArrival: ArrivalEntity | null = null;
    let closestPastArrival: ArrivalEntity | null = null;
    let minFutureDiff = Infinity;
    let minPastDiff = Infinity;

    for (const arrival of arrivals) {
        const { arrival_date, departure_date } = arrival;
        const arrivalTime = dayjs(arrival_date).startOf('day').add(7, 'hours');
        const departureTime = dayjs(departure_date).endOf('day').add(7, 'hours');

        if (now.isAfter(arrivalTime) && now.isBefore(departureTime)) {
            return arrival;
        }

        const futureDiff = arrivalTime.diff(now);
        const pastDiff = now.diff(departureTime);

        if (futureDiff >= 0 && futureDiff < minFutureDiff) {
            minFutureDiff = futureDiff;
            closestFutureArrival = arrival;
        }

        if (pastDiff >= 0 && pastDiff < minPastDiff) {
            minPastDiff = pastDiff;
            closestPastArrival = arrival;
        }
    }

    if (closestFutureArrival) {
        return closestFutureArrival;
    } else if (closestPastArrival) {
        return closestPastArrival;
    } else {
        return null;
    }
}

export const getFilterValueText = (field: FilterField, value: unknown): string => {
    if (value === true) {
        return 'Да';
    }
    if (value === false) {
        return 'Нет';
    }
    if (field.lookup) {
        return field.lookup().find(({ id }) => id === value)?.name ?? '(Пусто)';
    }
    if (value === '') {
        return '(Пусто)';
    }
    if (value === 'notempty') {
        return '(Не пусто)';
    }
    return String(value);
};
