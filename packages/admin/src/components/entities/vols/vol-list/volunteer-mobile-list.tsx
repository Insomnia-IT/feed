import { Spin, Tag, Modal, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { SwipeAction } from 'antd-mobile';
import { FC, useState } from 'react';
import dayjs from 'dayjs';
import { useDataProvider } from '@refinedev/core';

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

    return (arrivalDate.isSame(today, 'day') || arrivalDate.isSame(yesterday, 'day')) && 
           arrival.status !== 'STARTED' && 
           arrival.status !== 'JOINED';
};

/* Компонент отображающий список волонтеров на телефоне */
export const VolunteerMobileList: FC<{
    volList: Array<VolEntity>;
    isLoading: boolean;
    statusById: Record<string, string>;
    openVolunteer: (id: number) => Promise<boolean>;
}> = ({ isLoading, openVolunteer, statusById, volList }) => {
    const dataProvider = useDataProvider();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVol, setSelectedVol] = useState<VolEntity | null>(null);

    const handleAction = async (vol: VolEntity) => {
        const currentArrival = findClosestArrival(vol.arrivals);

        if (checkArrivalStatus(currentArrival)) {
            try {
                // Обновляем статус заезда на STARTED
                await dataProvider().update({
                    resource: 'volunteers',
                    id: vol.id,
                    variables: {
                        arrivals: vol.arrivals.map((arrival) =>
                            arrival.id === currentArrival?.id ? { ...arrival, status: 'STARTED' } : arrival
                        )
                    }
                });

                // Обновляем список волонтеров
                window.location.reload();
            } catch (error) {
                console.error('Ошибка при обновлении статуса:', error);
            }
        } else {
            setSelectedVol(vol);
            setIsModalOpen(true);
        }
    };

    const handleModalOk = () => {
        setIsModalOpen(false);
        if (selectedVol) {
            void openVolunteer(selectedVol.id);
        }
    };

    const handleModalCancel = () => {
        setIsModalOpen(false);
        setSelectedVol(null);
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
                                    currentArrival?.status === 'STARTED' || currentArrival?.status === 'JOINED'
                                        ? []
                                        : [
                                              {
                                                  key: 'edit',
                                                  text: '✓ Приступил',
                                                  color: '#34C759',
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
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="К карточке"
                cancelText="Обратно в список"
                closeIcon={null}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography.Title level={5} style={{ marginBottom: 16 }}>
                            Что-то не так, отредактируйте карточку
                        </Typography.Title>
                        <p>
                            Волонтер {selectedVol?.name} не отмечен "Приступил". Проверьте информацию в детальной карточке
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};
