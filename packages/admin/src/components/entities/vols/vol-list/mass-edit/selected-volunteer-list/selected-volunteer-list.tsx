import React from 'react';
import type { VolEntity } from 'interfaces';
import { CloseOutlined } from '@ant-design/icons';
import styles from './selected-volunteer-list.module.css';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { canBeVolunteerArrivalChanged, findTargetArrival } from '../utils';
import { useArrivalDates } from '../arrival-dates-context/arrival-dates-context';

export const SelectedVolunteerList: React.FC<{
    selectedVolunteers: VolEntity[];
    unselectVolunteer: (volunteer: VolEntity) => void;
    /** Подсвечивать волонтеров без текущего заезда */
    outlineVolunteersWithoutArrival?: boolean;
}> = ({ selectedVolunteers, unselectVolunteer, outlineVolunteersWithoutArrival = false }) => {
    const { date, dateType } = useArrivalDates();

    const volunteers = selectedVolunteers.map((vol: VolEntity) => {
        const title = vol.first_name || vol.last_name ? [vol.first_name, vol.last_name].join(' ') : vol.name;

        // На случай, когда нет ни ФИО, ни прозвища. Такого не должно быть, но есть(
        const fallback = 'user id #' + String(vol.id);

        const currentArrival = findTargetArrival(vol);

        const emptyArrivalText = 'заезд\u00A0не\u00A0найден';

        const isViolatingDates = canBeVolunteerArrivalChanged(vol, date, dateType);

        // Показываем фио, прозвище или fallback.
        return (
            <div key={vol.id} className={styles.item}>
                <span className={styles.bold}>{title?.trim() || fallback}</span>
                <span
                    className={[
                        styles.arrival,
                        isViolatingDates || (!currentArrival && outlineVolunteersWithoutArrival)
                            ? styles.notArrived
                            : ''
                    ].join(' ')}
                >
                    {currentArrival
                        ? `${dayjs(currentArrival.arrival_date).format('DD.MM')} - ${dayjs(currentArrival.departure_date).format('DD.MM')}`
                        : emptyArrivalText}
                </span>
                <Button
                    title="Убрать из выбора"
                    type="text"
                    size="small"
                    onClick={() => {
                        unselectVolunteer(vol);
                    }}
                >
                    <CloseOutlined />
                </Button>
            </div>
        );
    });

    return <section className={styles.list}>{volunteers}</section>;
};
