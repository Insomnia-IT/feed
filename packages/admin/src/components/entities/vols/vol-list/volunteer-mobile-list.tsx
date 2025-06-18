import React, { FC, useState, useCallback, useMemo } from 'react';
import { Spin, Tag, Modal, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { SwipeAction } from 'antd-mobile';
import dayjs from 'dayjs';
import { useDataProvider, useInvalidate } from '@refinedev/core';

import type { VolEntity, ArrivalEntity } from 'interfaces';
import { findClosestArrival, getOnFieldColors } from './volunteer-list-utils';

import styles from '../list.module.css';

const formatDate = (value?: string) => (value ? dayjs(value).format('D MMMM') : '');

const checkArrivalStatus = (arrival: ArrivalEntity | null): boolean => {
    if (!arrival) return false;

    const arrivalDate = dayjs(arrival.arrival_date);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    return (
        (arrivalDate.isSame(today, 'day') || arrivalDate.isSame(yesterday, 'day')) &&
        arrival.status !== 'STARTED' &&
        arrival.status !== 'JOINED'
    );
};

const VolunteerMobileCard: FC<{
    vol: VolEntity;
    statusById: Record<string, string>;
    onStartArrival: (vol: VolEntity) => void;
    onOpen: (id: number) => void;
}> = React.memo(({ vol, statusById, onStartArrival, onOpen }) => {
    const currentArrival = useMemo(() => findClosestArrival(vol.arrivals), [vol.arrivals]);

    const visitDays = useMemo(
        () => `${formatDate(currentArrival?.arrival_date)} - ${formatDate(currentArrival?.departure_date)}`,
        [currentArrival]
    );

    const name = `${vol.name} ${vol.first_name} ${vol.last_name}`;
    const comment = vol?.direction_head_comment;
    const isBlocked = vol.is_blocked;
    const currentStatus = currentArrival ? statusById[currentArrival.status] : 'Статус неизвестен';

    const rightActions = useMemo(() => {
        if (!currentArrival || ['STARTED', 'JOINED'].includes(currentArrival.status)) return [];
        return [
            {
                key: 'edit',
                text: (
                    <div className={styles.swipeActionContent}>
                        <span className={styles.swipeActionIcon}>✓</span>
                        <span>Приступил</span>
                    </div>
                ),
                color: '#34C759',
                onClick: () => onStartArrival(vol)
            }
        ];
    }, [currentArrival, onStartArrival, vol]);

    return (
        <SwipeAction key={vol.id} rightActions={rightActions}>
            <div className={styles.volCard} onClick={() => onOpen(vol.id)}>
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
});

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

    const handleAction = useCallback(
        async (vol: VolEntity) => {
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
                    invalidate({ resource: 'volunteers', invalidates: ['all'] });
                } catch (error) {
                    console.error('Ошибка при обновлении статуса:', error);
                }
            } else {
                setSelectedVol(vol);
                setIsModalOpen(true);
            }
        },
        [dataProvider, invalidate]
    );

    const handleModalOk = useCallback(() => {
        setIsModalOpen(false);
        if (selectedVol) openVolunteer(selectedVol.id);
    }, [openVolunteer, selectedVol]);

    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
        setSelectedVol(null);
    }, []);

    const handleOpenVolunteer = useCallback((id: number) => openVolunteer(id), [openVolunteer]);

    return (
        <>
            <div className={styles.mobileVolList}>
                {isLoading ? (
                    <Spin />
                ) : (
                    volList.map((vol) => (
                        <VolunteerMobileCard
                            key={vol.id}
                            vol={vol}
                            statusById={statusById}
                            onStartArrival={handleAction}
                            onOpen={handleOpenVolunteer}
                        />
                    ))
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
                        <p>Перейдите к карточке волонтера {selectedVol?.name} и поправьте информацию о заезде там</p>
                    </div>
                </div>
            </Modal>
        </>
    );
};
