import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, message } from 'antd';
import { useList } from '@refinedev/core';
import axios from 'axios';

import { NEW_API_URL } from 'const';
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
import { dataProvider } from 'dataProvider';
import useCanAccess from '../use-can-access';
import { IData, IResult } from './common-history.types';
import { BOOL_MAP, FIELD_LABELS, IGNORE_FIELDS, STATUS_MAP, useIdNameMap } from './utils';

import styles from './common-history.module.css';

interface IProps {
    role: 'volunteer' | 'actor';
}

export const CommonHistory = ({ role }: IProps) => {
    const { id: volunteerId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [history, setHistory] = useState<IResult[]>([]);
    const [customFields, setCustomFields] = useState<CustomFieldEntity[]>([]);

    const canCancelGroupOperation = useCanAccess({
        action: 'bulk_edit',
        resource: 'volunteers'
    });

    const { data: kitchens } = useList<KitchenEntity>({ resource: 'kitchens', pagination: { pageSize: 0 } });
    const { data: feedTypes } = useList<FeedTypeEntity>({ resource: 'feed-types', pagination: { pageSize: 0 } });
    const { data: colors } = useList<ColorTypeEntity>({ resource: 'colors', pagination: { pageSize: 0 } });
    const { data: accessRoles } = useList<AccessRoleEntity>({ resource: 'access-roles', pagination: { pageSize: 0 } });
    const { data: volunteerRoles } = useList<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        pagination: { pageSize: 0 }
    });
    const { data: transports } = useList<TransportEntity>({ resource: 'transports', pagination: { pageSize: 0 } });
    const { data: statuses } = useList<StatusEntity>({ resource: 'statuses', pagination: { pageSize: 0 } });
    const { data: genders } = useList<AccessRoleEntity>({ resource: 'genders', pagination: { pageSize: 0 } });
    const { data: directions } = useList<DirectionEntity>({ resource: 'directions', pagination: { pageSize: 0 } });
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        filters: [{ field: 'is_deleted', operator: 'eq', value: 'all' }],
        pagination: { pageSize: 0 }
    });

    const kitchenById = useIdNameMap(kitchens);
    const feedTypeById = useIdNameMap(feedTypes);
    const colorById = useIdNameMap(colors, 'description');
    const accessRoleById = useIdNameMap(accessRoles);
    const volunteerRoleById = useIdNameMap(volunteerRoles);
    const transportById = useIdNameMap(transports);
    const statusById = useIdNameMap(statuses);
    const genderById = useIdNameMap(genders);
    const directionById = useIdNameMap(directions);
    const groupBadgeById = useIdNameMap(groupBadges);

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
        load();
        return () => {
            cancelled = true;
        };
    }, [volunteerId, role]);

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

    const fieldValue = useCallback(
        (obj: IData, key: string) => {
            if (!obj) return '';
            if (Object.keys(BOOL_MAP).includes(key)) {
                return BOOL_MAP[key as keyof typeof BOOL_MAP][Number(obj[key])];
            }
            if (['comment', 'direction_head_comment'].includes(key)) {
                return (obj[key] || '').replace(/<\/?[^>]+(>|$)/g, '');
            }
            const maps: Record<string, Record<any, string>> = {
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
            if (maps[key]) {
                return maps[key][obj[key]];
            }
            if (key === 'directions') {
                return obj[key]?.map((id: string | number) => directionById[id]).join(', ');
            }
            if (key === 'value') {
                return obj[key] === 'true' ? 'Да' : obj[key] === 'false' ? 'Нет' : obj[key];
            }
            return obj[key];
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

    const cancelGroupOperation = useCallback(async (groupUuid: string) => {
        try {
            await axios.delete(`${NEW_API_URL}/volunteer-group/${groupUuid}/`);
            message.success('Групповая операция отменена');
            setHistory((prev) => prev.filter((item) => item.group_operation_uuid !== groupUuid));
        } catch {
            message.error('Не удалось отменить групповую операцию');
        }
    }, []);

    const confirmCancel = useCallback(
        (uuid: string) => {
            Modal.confirm({
                title: 'Отмена групповой операции',
                content: 'Вы уверены, что хотите отменить групповую операцию?',
                okText: 'Да',
                cancelText: 'Отмена',
                onOk: () => cancelGroupOperation(uuid)
            });
        },
        [cancelGroupOperation]
    );

    const historyLayout = useCallback(
        (item: IResult) =>
            Object.entries(item.data)
                .filter(([key]) => !IGNORE_FIELDS.has(key))
                .map(([key]) => {
                    const customName =
                        key === 'value' ? customFields.find((f) => f.id === +item.data.custom_field)?.name : undefined;
                    return (
                        <div key={key} className={styles.itemDescrWrap}>
                            <span className={styles.itemAction}>
                                {customName ?? FIELD_LABELS[key] ?? 'кастомное поле удалено'}
                            </span>
                            <br />
                            <span className={styles.itemDrescrOld}>{fieldValue(item.old_data, key) || ''}</span>
                            <span className={styles.itemDrescrNew}>{fieldValue(item.data, key) || '‑'}</span>
                        </div>
                    );
                }),
        [customFields, fieldValue]
    );

    const actorName = (it: IResult) =>
        role === 'volunteer'
            ? (it.actor?.name ?? (it.by_sync ? 'Синхронизация' : 'Админ'))
            : (it.volunteer?.name ?? 'Админ');

    const routeId = (it: IResult) => (role === 'volunteer' ? it.actor?.id : it.volunteer?.id);

    const titleAddition = useMemo(
        () => ({
            arrival: 'информацию по заезду',
            volunteer: 'информацию по волонтеру',
            volunteercustomfieldvalue: 'информацию по кастомному полю'
        }),
        []
    );

    return (
        <div className={styles.historyWrap}>
            {history.length === 0
                ? 'ИЗМЕНЕНИЙ НЕТ'
                : history.map((it) => (
                      <div key={it.action_at + it.status} className={styles.historyItem}>
                          <div className={styles.itemTitleWrap}>
                              <span
                                  className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                                  onClick={routeId(it) ? () => navigate(`/volunteers/edit/${routeId(it)}`) : undefined}
                              >
                                  {actorName(it)},
                              </span>
                              <span className={styles.itemTitle}>{formatDate(it.action_at)}</span>
                              <span className={styles.itemAction}>{STATUS_MAP[it.status]}</span>
                              {titleAddition[it.object_name] && (
                                  <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                                      {titleAddition[it.object_name]}
                                  </span>
                              )}
                              {historyLayout(it)}
                          </div>
                          {it.group_operation_uuid && canCancelGroupOperation && (
                              <Button
                                  type="link"
                                  danger
                                  onClick={() => confirmCancel(it.group_operation_uuid!)}
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
