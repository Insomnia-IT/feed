import { Modal, Tag } from 'antd';
import { getUserData } from 'auth';
import React, { FC } from 'react';
import { useAddWash } from '../hooks/useAddWash';
import { useSearchVolunteer } from '../hooks/useSearchVolunteer';
import { useList, useNotification } from '@refinedev/core';
import { type ArrivalEntity, WashEntity } from 'interfaces';
import dayjs from 'dayjs';
import { isActivatedStatus } from 'shared/lib';

import styles from './washes-post-scan.module.css';
import { getDaysOnFieldText, getTotalDaysOnFieldText } from '../list/utils';

export interface PostScanProps {
    volunteerQr?: string;
    onClose: () => void;
}

export const PostScan: FC<PostScanProps> = ({ volunteerQr, onClose }) => {
    const { open = () => {} } = useNotification();
    const { mutate: addWash, isLoading: isUpdateInProgress } = useAddWash();

    const { data: volunteer, isLoading: isVolunteerLoading } = useSearchVolunteer(volunteerQr);

    const { data: volunteerWashes, isLoading: isWashesLoading } = useList<WashEntity>({
        resource: 'washes',
        filters: [{ field: 'volunteer', operator: 'eq', value: volunteer?.id }],
        sorters: [{ field: 'created_at', order: 'asc' }]
    });

    const targetWashes = volunteer ? (volunteerWashes?.data ?? []) : [];

    const currentArrival: ArrivalEntity | undefined = volunteer?.arrivals.find(
        ({ arrival_date, departure_date }: { arrival_date: string; departure_date: string }) =>
            dayjs(arrival_date) < dayjs() && dayjs(departure_date) > dayjs().subtract(1, 'day')
    );

    const washDate = dayjs();
    const daysOnFieldText = getDaysOnFieldText({ volunteer, washDate });
    const totalDaysOnFieldText = getTotalDaysOnFieldText({ volunteer, washDate });
    const dateOfCurrentArrival = currentArrival
        ? `${dayjs(currentArrival.arrival_date).format('DD MMM YYYY')} (${daysOnFieldText} дн. назад)`
        : 'Нет активного заезда';

    const washesInCurrentArrival =
        targetWashes.filter((washItem) => {
            return (
                currentArrival &&
                dayjs(currentArrival.arrival_date).startOf('day') < dayjs(washItem.created_at) &&
                dayjs(washItem.created_at) < dayjs(currentArrival.departure_date).endOf('day')
            );
        }) ?? [];

    const isLoading = isWashesLoading || isVolunteerLoading;

    const latestWash = washesInCurrentArrival.length ? washesInCurrentArrival[0] : undefined;

    const latestWashDateText = latestWash ? dayjs(latestWash.created_at).format('DD MMM YYYY') : 'не было';

    const directions = volunteer?.directions?.map(({ name }) => (
        <Tag key={name} color={'default'} icon={false} closable={false}>
            {name}
        </Tag>
    ));

    const handleWash = async () => {
        const userData = await getUserData(true);

        if (!volunteer || isVolunteerLoading) {
            open({
                message: 'Ошибка: не найден волонтер',
                type: 'error'
            });

            return;
        }

        if (typeof userData !== 'object' || !userData?.id) {
            open({
                message: 'Ошибка: не найден ID актора',
                type: 'error'
            });

            return;
        }

        addWash(
            {
                volunteer: volunteer.id,
                actor: Number(userData.id),
                wash_count: (washesInCurrentArrival?.length ?? 0) + 1
            },
            {
                onSuccess: (): void => {
                    open({
                        message: 'Стирка успешно добавлена',
                        type: 'success',
                        undoableTimeout: 3000
                    });

                    onClose();
                },
                onError: (error): void => {
                    console.error(error);

                    open({
                        message: 'Ошибка при добавлении стрики',
                        type: 'error'
                    });

                    onClose();
                }
            }
        );
    };

    return (
        <Modal
            title="Подтверждение стирки"
            open={true}
            onOk={handleWash}
            onCancel={onClose}
            onClose={onClose}
            okText="Стирать"
            cancelText="Отмена"
            confirmLoading={isUpdateInProgress}
            loading={isLoading}
        >
            {volunteer && (
                <>
                    <ModalItem title="Имя, позывной" value={volunteer?.name} />
                    <ModalItem title="Бан" value={volunteer?.is_blocked ? 'Да' : 'Нет'} />
                    <ModalItem title="Службы" value={directions} />
                    <ModalItem title="Дней проведено на поле" value={daysOnFieldText} />
                    <ModalItem title="Всего дней в заезде" value={totalDaysOnFieldText} />
                    <ModalItem title="Сколько раз стирался уже" value={washesInCurrentArrival.length} />
                    <ModalItem title="Дата последней стирки" value={latestWashDateText} />
                    <ModalItem title="Дата заезда" value={dateOfCurrentArrival} />

                    <p className={styles.message}>
                        <b>Вы хотите добавить стирку для волонтера?</b>
                    </p>
                </>
            )}
            {!volunteer && (
                <p className={styles.message}>
                    <b>Бейдж не найден</b>
                </p>
            )}
        </Modal>
    );
};

const ModalItem: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => {
    return (
        <div className={styles.item}>
            <p>{title}</p>
            <p>{value}</p>
        </div>
    );
};
