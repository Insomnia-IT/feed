import type { ReactNode } from 'react';

import type {
    HistoryLookupMaps,
    HistoryViewModel,
    IHistoryChangeData,
    HistoryIntervalValue,
    IHistoryRecord
} from './common-history.types';
import { BOOL_MAP, FIELD_LABELS, IGNORE_FIELDS, STATUS_MAP } from './utils';

const BOOL_KEY_SET = new Set(Object.keys(BOOL_MAP));
const COMMENT_KEY_SET = new Set(['comment', 'direction_head_comment']);
const DATE_KEY_SET = new Set(['arrival_date', 'departure_date']);

export const TITLE_ADDITION: Record<IHistoryRecord['object_name'], string> = {
    arrival: 'информацию по заезду',
    paidarrival: 'информацию по платному питанию',
    volunteer: 'информацию по волонтеру',
    volunteercustomfieldvalue: 'информацию по кастомному полю'
};

export const isHistoryIntervalValue = (value: unknown): value is HistoryIntervalValue =>
    value !== null &&
    typeof value === 'object' &&
    ('arrival_date' in value || 'departure_date' in value || 'is_free' in value);

export const formatHistoryDateValue = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Moscow'
    });
};

const formatPaidArrivalItem = (value: HistoryIntervalValue) => {
    const interval = [value.arrival_date, value.departure_date]
        .filter((date): date is string => Boolean(date))
        .map(formatHistoryDateValue)
        .join(' - ');
    const freeLabel = typeof value.is_free === 'boolean' ? (value.is_free ? 'бесплатно' : 'платно') : '';

    if (interval && freeLabel) return `${interval}, ${freeLabel}`;
    return interval || freeLabel || '';
};

export const getHistoryActorLabel = (item: IHistoryRecord, role: 'volunteer' | 'actor') => {
    if (role === 'volunteer') {
        return item.actor?.name ?? (item.by_sync ? 'Синхронизация' : 'Админ');
    }

    return item.volunteer?.name ?? 'Админ';
};

export const createHistoryFieldFormatter = ({
    directionById,
    lookupMaps,
    renderVolunteerLink
}: {
    directionById: Record<string, string>;
    lookupMaps: HistoryLookupMaps;
    renderVolunteerLink: (params: { id: number; name: string }) => ReactNode;
}) => {
    return (obj: IHistoryChangeData | null, key: string): ReactNode => {
        if (!obj) return '';

        if (BOOL_KEY_SET.has(key)) {
            return BOOL_MAP[key as keyof typeof BOOL_MAP][Number(obj[key])];
        }

        if (DATE_KEY_SET.has(key)) {
            const value = obj[key];
            return typeof value === 'string' ? formatHistoryDateValue(value) : '';
        }

        if (COMMENT_KEY_SET.has(key)) {
            const value = obj[key];
            return typeof value === 'string' ? value.replace(/<\/?[^>]+(>|$)/g, '') : '';
        }

        if (key === 'supervisor') {
            const supervisor = obj[key];

            if (supervisor && typeof supervisor === 'object' && 'id' in supervisor && 'name' in supervisor) {
                return renderVolunteerLink({ id: supervisor.id, name: supervisor.name });
            }

            return '-';
        }

        if (key in lookupMaps) {
            const value = obj[key];
            if (typeof value === 'string' || typeof value === 'number') {
                return lookupMaps[key as keyof HistoryLookupMaps][value];
            }
            return '';
        }

        if (key === 'directions') {
            const values = obj[key] as Array<string | number> | undefined;
            return (values ?? [])
                .map((id) => directionById[String(id)])
                .filter(Boolean)
                .join(', ');
        }

        if (key === 'paid_arrivals') {
            const value = obj[key];
            if (!Array.isArray(value)) return '';
            return value.filter(isHistoryIntervalValue).map(formatPaidArrivalItem).filter(Boolean).join('; ');
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
    };
};

export const buildHistoryView = ({
    customFieldNameById,
    formatDate,
    formatFieldValue,
    history,
    role,
    routeActorId
}: {
    customFieldNameById: Record<number, string>;
    formatDate: (iso: string) => string;
    formatFieldValue: (obj: IHistoryChangeData | null, key: string) => ReactNode;
    history: IHistoryRecord[];
    role: 'volunteer' | 'actor';
    routeActorId: (item: IHistoryRecord) => number | undefined;
}): HistoryViewModel[] =>
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
            actorLabel: getHistoryActorLabel(item, role),
            actorRouteId: routeActorId(item),
            actionAt: formatDate(item.action_at),
            statusLabel: STATUS_MAP[item.status],
            titleAddition: TITLE_ADDITION[item.object_name],
            fields,
            groupOperationUuid: item.group_operation_uuid
        };
    });
