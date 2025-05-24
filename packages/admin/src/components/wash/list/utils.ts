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

export const getDaysOnFieldText = ({ volunteer, washDate }: { volunteer?: VolEntity; washDate: Dayjs }): string => {
    const currentArrival: ArrivalEntity | undefined = volunteer?.arrivals.find(
        ({ arrival_date, departure_date }: { arrival_date: string; departure_date: string }) =>
            dayjs(arrival_date) < dayjs(washDate) && dayjs(departure_date) > washDate.subtract(1, 'day')
    );

    return currentArrival
        ? // Количество дней в заездах = разница между датами + один день
          String(Math.abs(dayjs(currentArrival.arrival_date).diff(dayjs(currentArrival.departure_date), 'day')) + 1)
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
        daysOnField: getDaysOnFieldText({ volunteer: wash.volunteer, washDate: dayjs(wash.created_at) }),
        owlName
    };
};
