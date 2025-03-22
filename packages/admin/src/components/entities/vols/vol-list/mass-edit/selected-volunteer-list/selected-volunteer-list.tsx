import React from 'react';
import type { VolEntity } from 'interfaces';
import styles from './selected-volunteer-list.module.css';

export const SelectedVolunteerList: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const volunteers = selectedVolunteers.map((vol: VolEntity) => {
        const title = vol.first_name || vol.last_name ? [vol.first_name, vol.last_name].join(' ') : vol.name;

        // На случай, когда нет ни ФИО, ни прозвища. Такого не должно быть, но есть(
        const fallback = 'user id #' + String(vol.id);

        // Показываем фио, прозвище или fallback.
        return (
            <div key={vol.id} className={styles.item}>
                <span className={styles.bold}>{title?.trim() || fallback}</span>
            </div>
        );
    });

    return <section className={styles.list}>{volunteers}</section>;
};
