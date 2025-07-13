import { type ArrivalEntity, VolEntity, WashEntity } from 'interfaces';
import dayjs, { Dayjs } from 'dayjs';
import { isActivatedStatus } from 'shared/lib';

export interface WashToShow {
    id: number;
    volunteerName?: string;
    volunteerFullName?: string;
    directions?: string[];
    washDate: Dayjs;
    daysOnField: string;
    washCount: number;
    owlName: string;
}

const NO_ACTIVE_ARRIVAL = 'У волонтера нет активного заезда';

const getCurrentArrival = ({
    volunteer,
    washDate
}: {
    volunteer?: VolEntity;
    washDate: Dayjs;
}): ArrivalEntity | undefined => {
    const currentArrival: ArrivalEntity | undefined = volunteer?.arrivals.find(
        ({ arrival_date, departure_date, status }) =>
            dayjs(arrival_date) < dayjs(washDate) &&
            dayjs(departure_date) > washDate.subtract(1, 'day') &&
            isActivatedStatus(status)
    );

    return currentArrival;
};

export const getDaysOnFieldText = ({ volunteer, washDate }: { volunteer?: VolEntity; washDate: Dayjs }): string => {
    const currentArrival = getCurrentArrival({ volunteer, washDate });

    return currentArrival
        ? // Количество дней в заездах = разница между washDate и датой заезда
          String(Math.abs(dayjs(currentArrival.arrival_date).diff(dayjs(washDate), 'day')))
        : NO_ACTIVE_ARRIVAL;
};

export const getTotalDaysOnFieldText = ({
    volunteer,
    washDate
}: {
    volunteer?: VolEntity;
    washDate: Dayjs;
}): string => {
    const currentArrival = getCurrentArrival({ volunteer, washDate });

    return currentArrival
        ? // Количество дней в заездах = разница между датами + один день
          String(Math.abs(dayjs(currentArrival.arrival_date).diff(dayjs(currentArrival.departure_date), 'day')) + 1)
        : NO_ACTIVE_ARRIVAL;
};

export const getCurrentArrivalDateText = ({
    volunteer,
    washDate
}: {
    volunteer?: VolEntity;
    washDate: Dayjs;
}): string => {
    const currentArrival = getCurrentArrival({ volunteer, washDate });

    return currentArrival && isActivatedStatus(currentArrival.status)
        ? `${dayjs(currentArrival.arrival_date).format('DD MMM YYYY')} (${dayjs(washDate).diff(currentArrival.arrival_date, 'day')} дн. назад)`
        : NO_ACTIVE_ARRIVAL;
};

export const getLatestWashDateText = ({
    latestWash,
    washDate
}: {
    latestWash?: WashEntity;
    washDate: Dayjs;
}): string => {
    return latestWash ? `${dayjs(latestWash.created_at).format('DD MMM YYYY')} (${dayjs(washDate).diff(dayjs(latestWash.created_at), 'day')} дн. назад)` : '-';
};

export const transformWashesForShow = (wash: WashEntity): WashToShow => {
    const { name: owlName = 'Анонимная Сова' } = wash.actor;
    const { name = 'Аноним', first_name, last_name, directions } = wash.volunteer;

    return {
        id: wash.id,
        volunteerName: name,
        volunteerFullName: [first_name, last_name].join(' '),
        directions: directions?.map((direction) => direction.name),
        washDate: dayjs(wash.created_at),
        daysOnField: getDaysOnFieldText({ volunteer: wash.volunteer, washDate: dayjs(wash.created_at) }),
        washCount: wash.wash_count ?? 0,
        owlName
    };
};
