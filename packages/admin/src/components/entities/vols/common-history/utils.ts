import { useMemo } from 'react';
import { GetListResponse } from '@refinedev/core';

export const FIELD_LABELS: Record<string, string> = {
    comment: 'Комментарий',
    direction_head_comment: 'Комментарий руководителя локации',
    feed_type: 'Тип питания',
    main_role: 'Роль',
    access_role: 'Право доступа',
    kitchen: 'Кухня',
    color_type: 'Цвет бейджа',
    first_name: 'Имя',
    gender: 'Пол',
    last_name: 'Фамилия',
    name: 'Имя на бейдже',
    phone: 'Телефон',
    position: 'Должность',
    vegan: 'Веганство',
    departure_transport: 'Как уехал',
    arrival_transport: 'Как приехал',
    status: 'Статус',
    departure_date: 'Дата отъезда',
    arrival_date: 'Дата приезда',
    is_blocked: 'Статус блокировки',
    custom_field: 'Кастомное поле',
    directions: 'Службы/локации',
    group_badge: 'Групповой бейдж',
    number: 'Номер бейджа',
    batch: 'Партия бейджа',
    is_ticket_received: 'Билет'
};

export const STATUS_MAP: Record<string, string> = {
    updated: 'Обновил',
    inserted: 'Добавил',
    deleted: 'Удалил'
};

export const BOOL_MAP = {
    vegan: ['Мясоед', 'Веган'],
    is_blocked: ['Разблокирован', 'Заблокирован'],
    is_ticket_received: ['Не выдан', 'Выдан']
};

export const IGNORE_FIELDS = new Set(['id', 'volunteer', 'badge', 'deleted', 'feed', 'role', 'custom_field']);

export function useIdNameMap<T extends { id: number | string }>(list?: GetListResponse<T>, field?: keyof T) {
    return useMemo<Record<string, string>>(
        () =>
            (list?.data ?? []).reduce((acc, i) => {
                const key = field ?? ('name' as keyof T);
                return { ...acc, [i.id]: String(i[key]) };
            }, {}),
        [list, field]
    );
}
