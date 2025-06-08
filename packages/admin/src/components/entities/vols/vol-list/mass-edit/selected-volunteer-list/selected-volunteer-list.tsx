import React from 'react';
import type { ArrivalEntity, VolEntity } from 'interfaces';
import { CloseOutlined } from '@ant-design/icons';
import styles from './selected-volunteer-list.module.css';
import { Button } from 'antd';
import dayjs from 'dayjs';

function findTargetArrival(vol: VolEntity): ArrivalEntity | undefined {
    const arrivals = vol?.arrivals;

    if (!arrivals) {
        return undefined;
    }

    return arrivals.find((item) => {
        return dayjs(item.departure_date).endOf('day').add(7, 'hours').isAfter(dayjs().startOf('day'));
    });
}

export const SelectedVolunteerList: React.FC<{
    selectedVolunteers: VolEntity[];
    unselectVolunteer: (volunteer: VolEntity) => void;
}> = ({ selectedVolunteers, unselectVolunteer }) => {
    const volunteers = selectedVolunteers.map((vol: VolEntity) => {
        const title = vol.first_name || vol.last_name ? [vol.first_name, vol.last_name].join(' ') : vol.name;

        // На случай, когда нет ни ФИО, ни прозвища. Такого не должно быть, но есть(
        const fallback = 'user id #' + String(vol.id);

        const currentArrival = findTargetArrival(vol);

        // Показываем фио, прозвище или fallback.
        return (
            <div key={vol.id} className={styles.item}>
                <span className={styles.bold}>{title?.trim() || fallback}</span>
                <span className={styles.arrival}>
                    {currentArrival
                        ? `${dayjs(currentArrival.arrival_date).format('DD.MM')} - ${dayjs(currentArrival.departure_date).format('DD.MM')}`
                        : ''}
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
