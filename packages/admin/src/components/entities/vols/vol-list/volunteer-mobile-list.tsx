import { Spin, Tag } from 'antd';
import { FC } from 'react';

import type { VolEntity } from 'interfaces';
import { findClosestArrival, getOnFieldColors } from './volunteer-list-utils';

import styles from '../list.module.css';

const formatDate = (value?: string): string => {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleString('ru', {
        day: 'numeric',
        month: 'long'
    });
};

/* Компонент отображающий список волонтеров на телефоне */
export const VolunteerMobileList: FC<{
    volList: Array<VolEntity>;
    isLoading: boolean;
    statusById: Record<string, string>;
    openVolunteer: (id: number) => Promise<boolean>;
}> = ({ isLoading, openVolunteer, statusById, volList }) => {
    return (
        <div className={styles.mobileVolList}>
            {isLoading ? (
                <Spin />
            ) : (
                volList.map((vol) => {
                    const currentArrival = findClosestArrival(vol.arrivals);
                    const visitDays = `${formatDate(
                        currentArrival?.arrival_date
                    )} - ${formatDate(currentArrival?.departure_date)}`;
                    const name = `${vol.name} ${vol.first_name} ${vol.last_name}`;
                    const comment = vol?.direction_head_comment;
                    const isBlocked = vol.is_blocked;
                    const currentStatus = currentArrival ? statusById[currentArrival?.status] : 'Статус неизвестен';

                    return (
                        <div
                            className={styles.volCard}
                            key={vol.id}
                            onClick={() => {
                                void openVolunteer(vol.id);
                            }}
                        >
                            <div className={`${styles.textRow} ${styles.bold}`}>{name}</div>
                            <div className={styles.textRow}>{visitDays || 'Нет данных о датах'}</div>
                            <div>
                                {isBlocked && <Tag color="red">Заблокирован</Tag>}
                                {<Tag color={getOnFieldColors(vol)}>{currentStatus}</Tag>}
                            </div>
                            <div className={styles.textRow}>
                                <span className={styles.bold}>Заметка: </span>
                                {comment || '-'}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
