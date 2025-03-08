import React from 'react';
import type { VolEntity } from 'interfaces';
import styles from './selected-volunteer-list.module.css';

export const SelectedVolunteerList: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const volunteers = selectedVolunteers.map((vol) => {
        return (
            <div key={vol.id} className={styles.item}>
                <span className={styles.counter}>{vol.id}</span>
                <span className={styles.bold}>{[vol.first_name, vol.last_name].join(' ')}</span>
            </div>
        );
    });

    return <section className={styles.list}>{volunteers}</section>;
};
