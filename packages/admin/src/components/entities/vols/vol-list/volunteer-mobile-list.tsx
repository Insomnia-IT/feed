import { Spin, Tag, Modal } from 'antd';
import { SwipeAction } from 'antd-mobile';
import { FC, useState } from 'react';
import dayjs from 'dayjs';
import { useDataProvider } from '@refinedev/core';
import { CloseCircleOutlined } from '@ant-design/icons';

import type { VolEntity, ArrivalEntity } from 'interfaces';
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

const checkArrivalStatus = (arrival: ArrivalEntity | null): boolean => {
    if (!arrival) {
        return false;
    }

    const arrivalDate = dayjs(arrival.arrival_date);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    return (
        (arrivalDate.isSame(today, 'day') || arrivalDate.isSame(yesterday, 'day')) &&
        arrival.status !== 'on_field'
    );
};

/* Компонент отображающий список волонтеров на телефоне */
export const VolunteerMobileList: FC<{
    volList: Array<VolEntity>;
    isLoading: boolean;
    statusById: Record<string, string>;
    openVolunteer: (id: number) => Promise<boolean>;
}> = ({ isLoading, openVolunteer, statusById, volList }) => {
    const dataProvider = useDataProvider();
    const [modalVolunteer, setModalVolunteer] = useState<VolEntity | null>(null);

    const handleAction = async (vol: VolEntity) => {
        const currentArrival = findClosestArrival(vol.arrivals);
        
        if (currentArrival) {
            console.log(`Текущий статус заезда: ${statusById[currentArrival.status]}`);
        }
        
        if (checkArrivalStatus(currentArrival)) {
            try {
                // Обновляем статус заезда на ARRIVED
                await dataProvider().update({
                    resource: 'volunteers',
                    id: vol.id,
                    variables: {
                        arrivals: vol.arrivals.map(arrival => 
                            arrival.id === currentArrival?.id 
                                ? { ...arrival, status: 'ARRIVED' }
                                : arrival
                        )
                    }
                });
                
                // Обновляем список волонтеров
                window.location.reload();
            } catch (error) {
                console.error('Ошибка при обновлении статуса:', error);
            }
        } else {
            setModalVolunteer(vol);
        }
    };

    return (
        <>
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
                            <SwipeAction
                                key={vol.id}
                                rightActions={
                                    currentArrival?.status === 'ARRIVED'
                                        ? []
                                        : [
                                              {
                                                  key: 'edit',
                                                  text: '✓',
                                                  color: 'primary',
                                                  onClick: () => handleAction(vol)
                                              }
                                          ]
                                }
                            >
                                <div
                                    className={styles.volCard}
                                    onClick={() => {
                                        void openVolunteer(vol.id);
                                    }}
                                >
                                    <div className={`${styles.textRow} ${styles.bold}`}>{name}</div>
                                    <div className={styles.textRow}>{visitDays || 'Нет данных о датах'}</div>
                                    <div>
                                        {isBlocked && <Tag color="red">Заблокирован</Tag>}
                                        <Tag color={getOnFieldColors(vol)}>{currentStatus}</Tag>
                                    </div>
                                    <div className={styles.textRow}>
                                        <span className={styles.bold}>Заметка: </span>
                                        {comment || '-'}
                                    </div>
                                </div>
                            </SwipeAction>
                        );
                    })
                )}
            </div>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CloseCircleOutlined style={{ color: 'red', fontSize: '20px' }} />
                        <span>Что-то не так, отредактируйте карточку</span>
                    </div>
                }
                open={!!modalVolunteer}
                onCancel={() => setModalVolunteer(null)}
                footer={[
                    <button
                        key="back"
                        className="ant-btn ant-btn-default"
                        onClick={() => setModalVolunteer(null)}
                    >
                        Обратно в список
                    </button>,
                    <button
                        key="card"
                        className="ant-btn ant-btn-primary"
                        onClick={() => {
                            if (modalVolunteer) {
                                void openVolunteer(modalVolunteer.id);
                            }
                        }}
                    >
                        К карточке
                    </button>
                ]}
            >
                <p>
                    Волонтер "{modalVolunteer?.name}" не отмечен "Заехал на поле". 
                    Проверьте информацию в детальной карточке.
                </p>
            </Modal>
        </>
    );
};
