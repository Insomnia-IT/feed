import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Empty, Modal, Skeleton, message } from 'antd';
import { useList, type HttpError, useOne, useInvalidate } from '@refinedev/core';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GenderEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolEntity,
    VolunteerRoleEntity
} from 'interfaces';
import useCanAccess from '../use-can-access';
import type { HistoryLookupMaps, HistoryViewModel, IHistoryRecord } from './common-history.types';
import { buildHistoryView, createHistoryFieldFormatter } from './common-history.helpers';
import { useIdNameMap } from './utils';

import styles from './common-history.module.css';

interface IProps {
    role: 'volunteer' | 'actor';
}

const EMPTY_DESCRIPTION = 'ИЗМЕНЕНИЙ НЕТ';
const CANCEL_MODAL_TITLE = 'Отмена групповой операции';
const CANCEL_MODAL_TEXT = 'Вы уверены, что хотите отменить групповую операцию?';
const CANCEL_SUCCESS_TEXT = 'Групповая операция отменена';
const CANCEL_ERROR_TEXT = 'Не удалось отменить групповую операцию';
const LOAD_ERROR_TEXT = 'Ошибка загрузки истории';

const useLookUpParams = () => {
    const kitchensList = useList<KitchenEntity, HttpError>({ resource: 'kitchens', pagination: { mode: 'off' } });
    const feedTypesList = useList<FeedTypeEntity, HttpError>({ resource: 'feed-types', pagination: { mode: 'off' } });
    const colorsList = useList<ColorTypeEntity, HttpError>({ resource: 'colors', pagination: { mode: 'off' } });
    const accessRolesList = useList<AccessRoleEntity, HttpError>({
        resource: 'access-roles',
        pagination: { mode: 'off' }
    });
    const volunteerRolesList = useList<VolunteerRoleEntity, HttpError>({
        resource: 'volunteer-roles',
        pagination: { mode: 'off' }
    });
    const transportsList = useList<TransportEntity, HttpError>({ resource: 'transports', pagination: { mode: 'off' } });
    const statusesList = useList<StatusEntity, HttpError>({ resource: 'statuses', pagination: { mode: 'off' } });
    const gendersList = useList<GenderEntity, HttpError>({ resource: 'genders', pagination: { mode: 'off' } });
    const directionsList = useList<DirectionEntity, HttpError>({ resource: 'directions', pagination: { mode: 'off' } });
    const groupBadgesList = useList<GroupBadgeEntity, HttpError>({
        resource: 'group-badges',
        filters: [{ field: 'is_deleted', operator: 'eq', value: 'all' }],
        pagination: { mode: 'off' }
    });
    const customFieldsList = useList<CustomFieldEntity, HttpError>({
        resource: 'volunteer-custom-fields',
        pagination: { mode: 'off' }
    });

    const kitchenById = useIdNameMap(kitchensList.query.data);
    const feedTypeById = useIdNameMap(feedTypesList.query.data);
    const accessRoleById = useIdNameMap(accessRolesList.query.data);
    const volunteerRoleById = useIdNameMap(volunteerRolesList.query.data);
    const transportById = useIdNameMap(transportsList.query.data);
    const statusById = useIdNameMap(statusesList.query.data);
    const genderById = useIdNameMap(gendersList.query.data);
    const directionById = useIdNameMap(directionsList.query.data);
    const groupBadgeById = useIdNameMap(groupBadgesList.query.data);

    const colorById = useMemo<Record<string | number, string>>(
        () =>
            Object.fromEntries(
                (colorsList.query.data?.data ?? []).map(({ id, description }) => [id, description ?? ''])
            ),
        [colorsList.query.data?.data]
    );
    const customFieldNameById = useMemo<Record<number, string>>(
        () => Object.fromEntries((customFieldsList.query.data?.data ?? []).map((field) => [field.id, field.name])),
        [customFieldsList.query.data?.data]
    );

    const lookupMaps = useMemo<HistoryLookupMaps>(
        () => ({
            kitchen: kitchenById,
            main_role: volunteerRoleById,
            access_role: accessRoleById,
            color_type: colorById,
            feed_type: feedTypeById,
            gender: genderById,
            status: statusById,
            group_badge: groupBadgeById,
            arrival_transport: transportById,
            departure_transport: transportById
        }),
        [
            accessRoleById,
            colorById,
            feedTypeById,
            genderById,
            groupBadgeById,
            kitchenById,
            statusById,
            transportById,
            volunteerRoleById
        ]
    );

    const isLookupLoading =
        kitchensList.query.isLoading ||
        feedTypesList.query.isLoading ||
        colorsList.query.isLoading ||
        accessRolesList.query.isLoading ||
        volunteerRolesList.query.isLoading ||
        transportsList.query.isLoading ||
        statusesList.query.isLoading ||
        gendersList.query.isLoading ||
        directionsList.query.isLoading ||
        groupBadgesList.query.isLoading ||
        customFieldsList.query.isLoading;

    return {
        lookupMaps,
        isLookupLoading,
        customFieldNameById,
        directionById
    };
};

export const CommonHistory = ({ role }: IProps) => {
    const invalidate = useInvalidate();
    const { id: volunteerId } = useParams<{ id: string }>();
    const { result: volunteer } = useOne<VolEntity>({
        resource: 'volunteers',
        id: volunteerId
    });

    const { result: historyResult, query } = useList<IHistoryRecord>({
        resource: 'history',
        pagination: { mode: 'off' },
        filters: [
            {
                field: role === 'actor' ? 'actor_badge' : 'volunteer_uuid',
                operator: 'eq',
                value: volunteer?.uuid
            }
        ]
    });

    const isHistoryLoading = query?.isLoading;

    const navigate = useNavigate();

    const history = useMemo(() => {
        return historyResult?.data.slice().reverse();
    }, [historyResult]);

    useEffect(() => {
        if (query?.error) {
            message.error(LOAD_ERROR_TEXT);
        }
    }, [query]);

    const [pendingCancelGroupUuid, setPendingCancelGroupUuid] = useState<string | null>(null);

    const canCancelGroupOperation = useCanAccess({
        action: 'bulk_edit',
        resource: 'volunteers'
    });

    const { lookupMaps, isLookupLoading, customFieldNameById, directionById } = useLookUpParams();

    const historyView = useMemo(() => {
        const formatFieldValue = createHistoryFieldFormatter({
            directionById,
            lookupMaps,
            renderVolunteerLink: ({ id, name }) => (
                <span
                    className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                    onClick={() => navigate(`/volunteers/edit/${id}`)}
                >
                    {name}
                </span>
            )
        });

        const formatDate = (iso: string) =>
            new Date(iso).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Moscow'
            });

        return buildHistoryView({
            customFieldNameById,
            formatDate,
            formatFieldValue,
            history,
            role,
            routeActorId: (item) => (role === 'volunteer' ? item.actor?.id : item.volunteer?.id)
        });
    }, [customFieldNameById, history, role, directionById, lookupMaps, navigate]);

    const cancelGroupOperation = useCallback(
        async (groupUuid: string) => {
            try {
                await axios.delete(`${NEW_API_URL}/volunteer-group/${groupUuid}/`);
                message.success(CANCEL_SUCCESS_TEXT);
                await query?.refetch();

                await invalidate({
                    resource: 'volunteers',
                    invalidates: ['detail'],
                    id: volunteerId
                });
            } catch {
                message.error(CANCEL_ERROR_TEXT);
            }
        },
        [query, invalidate, volunteerId]
    );

    if (isHistoryLoading || isLookupLoading) {
        return (
            <div className={`${styles.historyWrap} ${styles.historyLoading}`}>
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={styles.historyItem}>
                        <Skeleton
                            active
                            title={{ width: '42%' }}
                            paragraph={{ rows: 3, width: ['28%', '100%', '82%'] }}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (historyView.length === 0) {
        return (
            <div className={`${styles.historyWrap} ${styles.historyEmpty}`}>
                <Empty description={EMPTY_DESCRIPTION} />
            </div>
        );
    }

    return (
        <div className={styles.historyWrap}>
            <Modal
                title={CANCEL_MODAL_TITLE}
                open={pendingCancelGroupUuid !== null}
                onCancel={() => setPendingCancelGroupUuid(null)}
                okText="Да"
                cancelText="Отмена"
                onOk={async () => {
                    if (!pendingCancelGroupUuid) return;

                    await cancelGroupOperation(pendingCancelGroupUuid);

                    setPendingCancelGroupUuid(null);
                }}
            >
                <p>{CANCEL_MODAL_TEXT}</p>
            </Modal>
            {historyView.map((item) => (
                <HistoryItem
                    {...item}
                    key={item.key}
                    canCancelGroupOperation={canCancelGroupOperation}
                    setPendingCancelGroupUuid={setPendingCancelGroupUuid}
                />
            ))}
        </div>
    );
};

const HistoryItem: React.FC<
    HistoryViewModel & { canCancelGroupOperation?: boolean; setPendingCancelGroupUuid: (value: string | null) => void }
> = ({
    actorRouteId,
    actorLabel,
    actionAt,
    statusLabel,
    titleAddition,
    groupOperationUuid,
    fields,
    canCancelGroupOperation,
    setPendingCancelGroupUuid
}) => {
    const navigate = useNavigate();

    return (
        <div data-qa-id="HistoryItem" className={styles.historyItem}>
            <div className={styles.itemTopRow}>
                <div className={styles.itemTitleWrap}>
                    <div className={styles.itemHeader}>
                        <span
                            className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                            onClick={actorRouteId ? () => navigate(`/volunteers/edit/${actorRouteId}`) : undefined}
                        >
                            {actorLabel}
                        </span>
                        <span className={styles.itemDate}>{actionAt}</span>
                    </div>
                    <div className={styles.itemSummary}>
                        <span className={styles.itemAction}>{statusLabel}</span>
                        {titleAddition && <span className={styles.itemSummaryText}>{titleAddition}</span>}
                    </div>
                </div>
                {groupOperationUuid && canCancelGroupOperation && (
                    <Button
                        type="link"
                        danger
                        onClick={() => setPendingCancelGroupUuid(groupOperationUuid ?? null)}
                        className={styles.cancelGroupBtn}
                    >
                        Отменить
                    </Button>
                )}
            </div>
            <div className={styles.itemFields}>
                {fields.map((field) => (
                    <div key={field.key} className={styles.itemDescrWrap}>
                        <span className={styles.fieldLabel}>{field.label}</span>
                        <div className={styles.fieldValues}>
                            {field.oldValue && <span className={styles.itemDrescrOld}>{field.oldValue}</span>}
                            {field.newValue && <span className={styles.itemDrescrNew}>{field.newValue}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
