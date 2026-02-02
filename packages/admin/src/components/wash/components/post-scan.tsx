import { Modal, Tag, Spin } from 'antd';
import { getUserData } from 'auth';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { useList, useNotification } from '@refinedev/core';

import { useAddWash } from '../hooks/useAddWash';
import { useSearchVolunteer } from '../hooks/useSearchVolunteer';
import type { ArrivalEntity, WashEntity } from 'interfaces';
import { getTotalDaysOnFieldText, getCurrentArrivalDateText, getLatestWashDateText } from '../list/utils';

import styles from './washes-post-scan.module.css';

export interface PostScanProps {
    volunteerQr?: string;
    onClose: () => void;
}

export const PostScan = ({ volunteerQr, onClose }: PostScanProps) => {
    const { open = () => {} } = useNotification();
    const { mutate: addWash, isPending: isUpdateInProgress } = useAddWash();

    const { data: volunteer, isLoading: isVolunteerLoading } = useSearchVolunteer(volunteerQr);

    const { result: { data: washesData = [] } = { data: [] }, query: washesQuery } = useList<WashEntity>({
        resource: 'washes',
        filters: volunteer?.id ? [{ field: 'volunteer', operator: 'eq', value: volunteer.id }] : [],
        sorters: [{ field: 'created_at', order: 'desc' }],
        queryOptions: {
            enabled: Boolean(volunteer?.id)
        }
    });

    const targetWashes = volunteer ? washesData : [];

    const currentArrival: ArrivalEntity | undefined = volunteer?.arrivals.find(
        ({ arrival_date, departure_date }: { arrival_date: string; departure_date: string }) =>
            dayjs(arrival_date) < dayjs() && dayjs(departure_date) > dayjs().subtract(1, 'day')
    );

    const washDate = dayjs();
    const totalDaysOnFieldText = getTotalDaysOnFieldText({ volunteer, washDate });
    const dateOfCurrentArrivalAgo = getCurrentArrivalDateText({ volunteer, washDate });

    const washesInCurrentArrival = currentArrival
        ? targetWashes.filter((washItem: WashEntity) => {
              return (
                  dayjs(currentArrival.arrival_date).startOf('day') < dayjs(washItem.created_at) &&
                  dayjs(washItem.created_at) < dayjs(currentArrival.departure_date).endOf('day')
              );
          })
        : [];

    const isWashesLoading = washesQuery?.isLoading ?? false;
    const isLoading = isWashesLoading || isVolunteerLoading;

    const latestWash = washesInCurrentArrival.length ? washesInCurrentArrival[0] : undefined;

    const latestWashDateAgo = getLatestWashDateText({ latestWash, washDate });

    const directions = volunteer?.directions?.map(({ name }) => (
        <Tag key={name} color="default" icon={false} closable={false}>
            {name}
        </Tag>
    ));

    const handleWash = async () => {
        const userData = await getUserData(true);

        if (!volunteer || isVolunteerLoading) {
            open({ message: 'Ошибка: не найден волонтер', type: 'error' });
            return;
        }

        if (typeof userData !== 'object' || !userData?.id) {
            open({ message: 'Ошибка: не найден ID актора', type: 'error' });
            return;
        }

        addWash(
            {
                volunteer: volunteer.id,
                actor: Number(userData.id),
                wash_count: (washesInCurrentArrival?.length ?? 0) + 1
            },
            {
                onSuccess: () => {
                    open({
                        message: 'Стирка успешно добавлена',
                        type: 'success',
                        undoableTimeout: 3000
                    });
                    onClose();
                },
                onError: (error) => {
                    console.error(error);
                    open({ message: 'Ошибка при добавлении стрики', type: 'error' });
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
            okText="Стирать"
            cancelText="Отмена"
            confirmLoading={isUpdateInProgress}
        >
            <Spin spinning={isLoading}>
                {volunteer && (
                    <>
                        <ModalItem title="Имя, позывной" value={volunteer.name} />
                        <ModalItem title="Бан" value={volunteer.is_blocked ? 'Да' : 'Нет'} />
                        <ModalItem title="Службы" value={directions} />
                        <ModalItem title="Сколько раз стирался уже" value={washesInCurrentArrival.length} />
                        <ModalItem title="Дата заезда" value={dateOfCurrentArrivalAgo} />
                        <ModalItem title="Всего дней в заезде" value={totalDaysOnFieldText} />
                        <ModalItem title="Последняя стирка" value={latestWashDateAgo} />

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
            </Spin>
        </Modal>
    );
};

const ModalItem = ({ title, value }: { title: string; value: ReactNode }) => {
    return (
        <div className={styles.item}>
            <p>{title}</p>
            <p>{value}</p>
        </div>
    );
};
