import { useCallback, useMemo, useState, memo } from 'react';
import { Spin, Tag, Modal, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDataProvider, useInvalidate, useInfiniteList, type GetListResponse } from '@refinedev/core';

import type { VolEntity, ArrivalEntity } from 'interfaces';
import { findClosestArrival, getOnFieldColors } from './volunteer-list-utils';
import { InfiniteScrollNative } from './infinite-scroll-native';
import { SwipeActionRow, type SwipeActionItem } from './swipe-action-row';

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

const VolunteerMobileCard = memo(
    ({
        vol,
        statusById,
        onStartArrival,
        onOpen,
        loadingVolId
    }: {
        vol: VolEntity;
        statusById: Record<string, string>;
        onStartArrival: (vol: VolEntity) => void;
        onOpen: (id: number) => void;
        loadingVolId: number | null;
    }) => {
        const currentArrival = useMemo(() => findClosestArrival(vol.arrivals), [vol.arrivals]);

        const visitDays = useMemo(
            () => `${formatDate(currentArrival?.arrival_date)} - ${formatDate(currentArrival?.departure_date)}`,
            [currentArrival]
        );

        const rightActions = useMemo<SwipeActionItem[]>(() => {
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
            <SwipeActionRow rightActions={rightActions}>
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
            </SwipeActionRow>
        );
    }
);

export const VolunteerMobileList = ({
    filterQueryParams,
    statusById,
    openVolunteer
}: {
    filterQueryParams: string;
    statusById: Record<string, string>;
    openVolunteer: (id: number) => Promise<boolean>;
}) => {
    const dataProvider = useDataProvider();
    const invalidate = useInvalidate();

    const { query, result } = useInfiniteList<VolEntity>({
        resource: `volunteers/${filterQueryParams}`,
        pagination: { pageSize: PAGE_SIZE }
    });

    const list = useMemo(() => {
        return result.data?.pages.flatMap((page: GetListResponse<VolEntity>) => page.data) ?? [];
    }, [result.data]);

    const [loadingVolId, setLoadingVolId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVol, setSelectedVol] = useState<VolEntity | null>(null);

    const loadMore = useCallback(async () => {
        await query.fetchNextPage();
    }, [query]);

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
                    await query.refetch();
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
        [dataProvider, invalidate, query]
    );

    return (
        <>
            <div className={styles.mobileVolList}>
                {query.isLoading ? (
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
                        <InfiniteScrollNative
                            hasMore={Boolean(result.hasNextPage)}
                            loading={query.isFetchingNextPage}
                            error={query.isError}
                            onLoadMore={loadMore}
                            onRetry={() => query.refetch()}
                            loadingText="Загрузка..."
                            errorText="Ошибка загрузки."
                            emptyText="Больше ничего нет"
                            retryText="Повторить"
                        />
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
