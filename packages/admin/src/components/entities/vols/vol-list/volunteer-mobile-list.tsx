import { FC, useCallback, useState, useMemo, memo } from 'react';
import { Spin, Tag, Modal, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { SwipeAction, InfiniteScroll } from 'antd-mobile';
import dayjs from 'dayjs';
import { useDataProvider, useInvalidate, useInfiniteList } from '@refinedev/core';

import type { VolEntity, ArrivalEntity } from 'interfaces';
import { findClosestArrival, getOnFieldColors } from './volunteer-list-utils';

import styles from '../list.module.css';

const PAGE_SIZE = 50;

const formatDate = (value?: string) => (value ? dayjs(value).format('D MMMM') : '');

const checkArrivalStatus = (arrival: ArrivalEntity | null) => {
    if (!arrival) return false;
    const arrivalDate = dayjs(arrival.arrival_date);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    return (arrivalDate.isSame(today, 'day') || arrivalDate.isSame(yesterday, 'day')) && arrival.status === 'ARRIVED';
};

const VolunteerMobileCard: FC<{
    vol: VolEntity;
    statusById: Record<string, string>;
    onStartArrival: (vol: VolEntity) => void;
    onOpen: (id: number) => void;
    loadingVolId: number | null;
}> = memo(({ vol, statusById, onStartArrival, onOpen, loadingVolId }) => {
    const currentArrival = useMemo(() => findClosestArrival(vol.arrivals), [vol.arrivals]);

    const visitDays = useMemo(
        () => `${formatDate(currentArrival?.arrival_date)} - ${formatDate(currentArrival?.departure_date)}`,
        [currentArrival]
    );

    const rightActions = useMemo(() => {
        if (!currentArrival || currentArrival.status !== 'ARRIVED') return [];
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
        <SwipeAction key={`${vol.id}-${Date.now()}`} rightActions={rightActions}>
            <div className={styles.volCard} onClick={() => onOpen(vol.id)}>
                {loadingVolId === vol.id && (
                    <div className={styles.loaderOverlay}>
                        <Spin size="large" />
                    </div>
                )}
                <div className={`${styles.textRow} ${styles.bold}`}>
                    {`${vol.name} ${vol.first_name ?? ''} ${vol.last_name ?? ''}`}
                </div>
                <div className={styles.textRow}>{visitDays || 'Нет данных о датах'}</div>
                <div>
                    {vol.is_blocked && <Tag color="red">Заблокирован</Tag>}
                    <Tag color={getOnFieldColors(vol)}>
                        {currentArrival ? statusById[currentArrival.status] : 'Статус неизвестен'}
                    </Tag>
                </div>
                <div className={styles.textRow}>
                    <span className={styles.bold}>Заметка: </span>
                    {vol?.direction_head_comment || '-'}
                </div>
            </div>
        </SwipeAction>
    );
});

export const VolunteerMobileList: FC<{
    filterQueryParams: string;
    statusById: Record<string, string>;
    openVolunteer: (id: number) => Promise<boolean>;
}> = ({ filterQueryParams, statusById, openVolunteer }) => {
    const dataProvider = useDataProvider();
    const invalidate = useInvalidate();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
        useInfiniteList<VolEntity>({
            resource: `volunteers/${filterQueryParams}`,
            pagination: { pageSize: PAGE_SIZE }
        });

    const list = data?.pages.flatMap((p) => p.data) ?? [];

    const [loadingVolId, setLoadingVolId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVol, setSelectedVol] = useState<VolEntity | null>(null);

    const loadMore = useCallback(async () => {
        await fetchNextPage();
    }, [fetchNextPage]);

    const handleStartArrival = useCallback(
        async (vol: VolEntity) => {
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
                    await invalidate({
                        resource: 'volunteers',
                        invalidates: ['all']
                    });
                    // Ждем завершения всех GET запросов для обновления данных
                    await refetch();
                } catch (error) {
                    console.error('Ошибка при обновлении статуса:', error);
                } finally {
                    setLoadingVolId(null);
                }
            } else {
                setSelectedVol(vol);
                setIsModalOpen(true);
            }
        },
        [dataProvider, invalidate, refetch]
    );

    return (
        <>
            <div className={styles.mobileVolList}>
                {isLoading ? (
                    <Spin />
                ) : (
                    <>
                        {list.map((vol) => (
                            <VolunteerMobileCard
                                key={vol.id}
                                vol={vol}
                                statusById={statusById}
                                onStartArrival={handleStartArrival}
                                onOpen={openVolunteer}
                                loadingVolId={loadingVolId}
                            />
                        ))}
                        <InfiniteScroll loadMore={loadMore} hasMore={!!hasNextPage} threshold={120}>
                            {(hasMore, failed, retry) => {
                                if (failed || isError) {
                                    return (
                                        <div style={{ textAlign: 'center' }}>
                                            Ошибка загрузки.{' '}
                                            <button onClick={() => (retry ?? refetch)()}>Повторить</button>
                                        </div>
                                    );
                                }
                                if (!hasMore) {
                                    return (
                                        <div
                                            style={{
                                                textAlign: 'center',
                                                padding: 16
                                            }}
                                        >
                                            Больше ничего нет
                                        </div>
                                    );
                                }
                                return (
                                    <div style={{ textAlign: 'center', padding: 16 }}>
                                        {isFetchingNextPage ? 'Загрузка...' : null}
                                    </div>
                                );
                            }}
                        </InfiniteScroll>
                    </>
                )}
            </div>
            <Modal
                open={isModalOpen}
                onOk={() => {
                    setIsModalOpen(false);
                    if (selectedVol) openVolunteer(selectedVol.id);
                }}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedVol(null);
                }}
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
