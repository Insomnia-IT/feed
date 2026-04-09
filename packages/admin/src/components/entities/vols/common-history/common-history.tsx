import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Modal, message } from 'antd';
import { useList, type HttpError } from '@refinedev/core';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import { dataProvider } from 'dataProvider';
import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolunteerRoleEntity
} from 'interfaces';
import useCanAccess from '../use-can-access';
import type { HistoryChangeData as IData, HistoryRecord as IResult } from './common-history.types';
import type { HistoryViewModel } from './common-history.view-types';
import { BOOL_MAP, FIELD_LABELS, IGNORE_FIELDS, STATUS_MAP, useIdNameMap } from './utils';

import styles from './common-history.module.css';

interface IProps {
    role: 'volunteer' | 'actor';
}

const BOOL_KEY_SET = new Set(Object.keys(BOOL_MAP));
const COMMENT_KEY_SET = new Set(['comment', 'direction_head_comment']);
const TITLE_ADDITION: Partial<Record<IResult['object_name'], string>> = {
    arrival: 'информацию по заезду',
    volunteer: 'информацию по волонтеру',
    volunteercustomfieldvalue: 'информацию по кастомному полю'
};

export const CommonHistory = ({ role }: IProps) => {
    const { id: volunteerId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [history, setHistory] = useState<IResult[]>([]);
    const [customFields, setCustomFields] = useState<CustomFieldEntity[]>([]);
    const [pendingCancelGroupUuid, setPendingCancelGroupUuid] = useState<string | null>(null);

    const canCancelGroupOperation = useCanAccess({
        action: 'bulk_edit',
        resource: 'volunteers'
    });

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
    const gendersList = useList<AccessRoleEntity, HttpError>({ resource: 'genders', pagination: { mode: 'off' } });
    const directionsList = useList<DirectionEntity, HttpError>({ resource: 'directions', pagination: { mode: 'off' } });
    const groupBadgesList = useList<GroupBadgeEntity, HttpError>({
        resource: 'group-badges',
        filters: [{ field: 'is_deleted', operator: 'eq', value: 'all' }],
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
        () => Object.fromEntries(customFields.map((field) => [field.id, field.name])),
        [customFields]
    );

    useEffect(() => {
        if (!volunteerId) return;
        let cancelled = false;

        const load = async () => {
            try {
                const {
                    data: { uuid }
                } = await axios.get<{ uuid: string }>(`${NEW_API_URL}/volunteers/${volunteerId}`);
                const [historyRes, cfRes] = await Promise.all([
                    axios.get<{ results: IResult[] }>(`${NEW_API_URL}/history`, {
                        params: {
                            limit: 100000,
                            [role === 'actor' ? 'actor_badge' : 'volunteer_uuid']: uuid
                        }
                    }),
                    dataProvider.getList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' })
                ]);

                if (cancelled) return;
                setHistory(historyRes.data.results.slice().reverse());
                setCustomFields(cfRes.data);
            } catch {
                message.error('Ошибка загрузки истории');
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [role, volunteerId]);

    const formatDate = useCallback(
        (iso: string) =>
            new Date(iso).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Moscow'
            }),
        []
    );

    const formatFieldValue = useCallback(
        (obj: IData | null | undefined, key: string): ReactNode => {
            if (!obj) return '';

            if (BOOL_KEY_SET.has(key)) {
                return BOOL_MAP[key as keyof typeof BOOL_MAP][Number(obj[key])];
            }

            if (COMMENT_KEY_SET.has(key)) {
                const value = obj[key];
                return typeof value === 'string' ? value.replace(/<\/?[^>]+(>|$)/g, '') : '';
            }

            const maps: Record<string, Record<string | number, string>> = {
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
            };

            if (key === 'supervisor') {
                const { id, name } = obj[key] ?? {};

                return id ? (
                    <span
                        className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                        onClick={() => (window.location.href = `/volunteers/edit/${id}`)}
                    >
                        {name}
                    </span>
                ) : (
                    '-'
                );
            }

            if (maps[key]) {
                const value = obj[key];
                if (typeof value === 'string' || typeof value === 'number') {
                    return maps[key][value];
                }
                return '';
            }

            if (key === 'directions') {
                const values = obj[key] as Array<string | number> | undefined;
                return (values ?? [])
                    .map((id) => directionById[id])
                    .filter(Boolean)
                    .join(', ');
            }

            if (key === 'value') {
                const value = String(obj[key] ?? '');
                return value === 'true' ? 'Да' : value === 'false' ? 'Нет' : value;
            }

            const value = obj[key];

            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }

            if (typeof value === 'boolean') {
                return value ? 'Да' : 'Нет';
            }

            if (Array.isArray(value)) {
                return value.join(', ');
            }

            if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') {
                return value.name;
            }

            return '';
        },
        [
            accessRoleById,
            colorById,
            directionById,
            feedTypeById,
            genderById,
            groupBadgeById,
            kitchenById,
            statusById,
            transportById,
            volunteerRoleById
        ]
    );

    const historyView = useMemo<HistoryViewModel[]>(
        () =>
            history.map((item) => {
                const fields = Object.entries(item.data)
                    .filter(([key]) => !IGNORE_FIELDS.has(key))
                    .map(([key]) => ({
                        key,
                        label:
                            (key === 'value' ? customFieldNameById[Number(item.data.custom_field)] : undefined) ??
                            FIELD_LABELS[key] ??
                            'кастомное поле удалено',
                        oldValue: formatFieldValue(item.old_data, key) || '',
                        newValue: formatFieldValue(item.data, key) || '‑'
                    }));

                return {
                    key: String(item.id),
                    actorLabel:
                        role === 'volunteer'
                            ? (item.actor?.name ?? (item.by_sync ? 'Синхронизация' : 'Админ'))
                            : (item.volunteer?.name ?? 'Админ'),
                    actorRouteId: role === 'volunteer' ? item.actor?.id : item.volunteer?.id,
                    actionAt: formatDate(item.action_at),
                    statusLabel: STATUS_MAP[item.status],
                    titleAddition: TITLE_ADDITION[item.object_name],
                    fields,
                    groupOperationUuid: item.group_operation_uuid
                };
            }),
        [customFieldNameById, formatDate, formatFieldValue, history, role]
    );

    const cancelGroupOperation = useCallback(async (groupUuid: string) => {
        try {
            await axios.delete(`${NEW_API_URL}/volunteer-group/${groupUuid}/`);
            message.success('Групповая операция отменена');
            setHistory((prev) => prev.filter((item) => item.group_operation_uuid !== groupUuid));
        } catch {
            message.error('Не удалось отменить групповую операцию');
        }
    }, []);

    if (historyView.length === 0) {
        return <div className={styles.historyWrap}>ИЗМЕНЕНИЙ НЕТ</div>;
    }

    return (
        <div className={styles.historyWrap}>
            <Modal
                title="Отмена групповой операции"
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
                <p>Вы уверены, что хотите отменить групповую операцию?</p>
            </Modal>
            {historyView.map((item) => (
                <div key={item.key} className={styles.historyItem}>
                    <div className={styles.itemTitleWrap}>
                        <span
                            className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                            onClick={
                                item.actorRouteId ? () => navigate(`/volunteers/edit/${item.actorRouteId}`) : undefined
                            }
                        >
                            {item.actorLabel},
                        </span>
                        <span className={styles.itemTitle}>{item.actionAt}</span>
                        <span className={styles.itemAction}>{item.statusLabel}</span>
                        {item.titleAddition && (
                            <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                                {item.titleAddition}
                            </span>
                        )}
                        {item.fields.map((field) => (
                            <div key={field.key} className={styles.itemDescrWrap}>
                                <span className={styles.itemAction}>{field.label}</span>
                                <br />
                                <span className={styles.itemDrescrOld}>{field.oldValue}</span>
                                <span className={styles.itemDrescrNew}>{field.newValue}</span>
                            </div>
                        ))}
                    </div>
                    {item.groupOperationUuid && canCancelGroupOperation && (
                        <Button
                            type="link"
                            danger
                            onClick={() => setPendingCancelGroupUuid(item.groupOperationUuid ?? null)}
                            className={styles.cancelGroupBtn}
                        >
                            Отменить групповую операцию
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
};
