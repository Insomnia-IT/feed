import { Spin, Tag, Modal, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { SwipeAction } from 'antd-mobile';
import { FC, useState } from 'react';
import dayjs from 'dayjs';
import { useDataProvider, useInvalidate } from '@refinedev/core';

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
    const invalidate = useInvalidate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVol, setSelectedVol] = useState<VolEntity | null>(null);
    const [loadingVolId, setLoadingVolId] = useState<number | null>(null);

    const handleAction = async (vol: VolEntity) => {
        const currentArrival = findClosestArrival(vol.arrivals);

        if (checkArrivalStatus(currentArrival)) {
            try {
                setLoadingVolId(vol.id);
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
                invalidate({
                    resource: 'volunteers',
                    invalidates: ['all']
                });
            } catch (error) {
                console.error('Ошибка при обновлении статуса:', error);
            } finally {
                setLoadingVolId(null);
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
                                // Перемонтирование при изменении карточки с уникальным ключом для сброса состояния свайпа иначе не работает клик
                                key={`${vol.id}-${currentArrival?.status || 'unknown'}`}
                                rightActions={
                                    currentArrival?.status === 'STARTED' || currentArrival?.status === 'JOINED'
                                        ? []
                                        : [
                                              {
                                                  key: 'edit',
                                                  text: (
                                                      <div className={styles.swipeActionContent}>
                                                          <span className={styles.swipeActionIcon}>✓</span>
                                                          <span>Приступил</span>
                                                      </div>
                                                  ),
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
                                    {loadingVolId === vol.id && (
                                        <div className={styles.loaderOverlay}>
                                            <Spin size="large" />
                                        </div>
                                    )}
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
                <div className={styles.modalContent}>
                    <div className={styles.modalIconWrapper}>
                        <CloseCircleOutlined className={styles.modalIcon} />
                    </div>
                    <div className={styles.modalTextContent}>
                        <Typography.Title level={5} className={styles.modalTitle}>
                        Не найден подходящий заезд
                        </Typography.Title>
                        <p>
                        Перейдите к карточке волонтера {selectedVol?.name} и поправьте информацию о заезде там
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};
