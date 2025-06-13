import type { ArrivalEntity, VolEntity } from 'interfaces';
import dayjs from 'dayjs';

export function findTargetArrival(vol: VolEntity): ArrivalEntity | undefined {
    const arrivals = vol?.arrivals;

    if (!arrivals) {
        return undefined;
    }

    return arrivals.find((item) => {
        return dayjs(item.departure_date).endOf('day').isAfter(dayjs().startOf('day'));
    });
}
