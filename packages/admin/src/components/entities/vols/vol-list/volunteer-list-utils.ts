import dayjs from 'dayjs';

import type { ArrivalEntity, PaidArrivalEntity, VolEntity } from 'interfaces';
import { isVolunteerActivatedStatusValue } from 'shared/helpers/volunteer-status';
import { getSorter } from 'utils';

import type { FilterField } from './filters/filter-types';

export const getOnFieldColors = (
    vol: VolEntity,
    currentArrivalParam?: ArrivalEntity | null
): 'green' | 'red' | 'orange' | undefined => {
    const day = dayjs();
    const currentArrival = currentArrivalParam === undefined ? findClosestArrival(vol.arrivals) : currentArrivalParam;
    const currentArrivalArray: Array<ArrivalEntity> = [];
    if (currentArrival !== null) {
        currentArrivalArray.push(currentArrival);
    }

    if (
        currentArrivalArray.some(
            ({ arrival_date, departure_date, status }) =>
                isVolunteerActivatedStatusValue(status) &&
                day >= dayjs(arrival_date).startOf('day').add(7, 'hours') &&
                day <= dayjs(departure_date).endOf('day').add(7, 'hours')
        )
    ) {
        return currentArrival?.status === 'ARRIVED' ? 'orange' : 'green';
    }

    if (
        currentArrivalArray.some(
            ({ arrival_date, departure_date, status }) =>
                !isVolunteerActivatedStatusValue(status) &&
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

function getFormattedArrivalDate(arrivalString: string): string {
    const date = new Date(arrivalString);
    const options: Intl.DateTimeFormatOptions = {
        month: '2-digit',
        day: '2-digit'
    };

    return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

export function getFormattedArrivalIntervals(arrivals: Array<ArrivalEntity | PaidArrivalEntity>): string[] {
    return arrivals
        .slice()
        .sort(getSorter('arrival_date'))
        .map(({ arrival_date, departure_date }) => {
            const arrival = getFormattedArrivalDate(arrival_date);
            const departure = getFormattedArrivalDate(departure_date);
            return `${arrival} - ${departure}`;
        });
}

export const getFilterValueText = (field: FilterField, value: boolean | string): string => {
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
