import { type ArrivalEntity, VolEntity, WashEntity } from 'interfaces';
import dayjs, { Dayjs } from 'dayjs';

export interface WashToShow {
    id: number;
    volunteerName?: string;
    volunteerFullName?: string;
    directions?: string[];
    washDate: Dayjs;
    daysOnField: string;
    owlName: string;
}

const getDaysOnFieldText = (volunteer: VolEntity, washDate: string): string => {
    const currentArrival: ArrivalEntity | undefined = volunteer?.arrivals.find(
        ({ arrival_date, departure_date }: { arrival_date: string; departure_date: string }) =>
            dayjs(arrival_date) < dayjs(washDate) && dayjs(departure_date) > dayjs(washDate).subtract(1, 'day')
    );

    return currentArrival
        ? String(Math.abs(dayjs(currentArrival.arrival_date).diff(dayjs(currentArrival.departure_date), 'day')))
        : 'У волонтера нет активного заезда';
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
        daysOnField: getDaysOnFieldText(wash.volunteer, wash.created_at),
        owlName
    };
};
