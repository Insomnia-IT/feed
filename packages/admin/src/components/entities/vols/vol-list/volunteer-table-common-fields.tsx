import type { VolEntity } from 'interfaces';

export interface VolunteerField {
    fieldName: keyof VolEntity | 'on_field';
    title: string;
    isCustom?: boolean;
    isDefault?: boolean;
}

export interface VolunteerFieldExtended {
    fieldName: string;
    title: string;
    isCustom?: boolean;
    customFieldId?: number;
}

export const volunteerTableCommonFields: Array<VolunteerField> = [
    {
        fieldName: 'id',
        title: 'ID'
    },
    {
        fieldName: 'name',
        title: 'Позывной',
        isDefault: true
    },
    {
        fieldName: 'first_name',
        title: 'Имя',
        isDefault: true
    },
    {
        fieldName: 'last_name',
        title: 'Фамилия',
        isDefault: true
    },
    {
        fieldName: 'directions',
        title: 'Службы',
        isDefault: true
    },
    {
        fieldName: 'arrivals',
        title: 'Даты на поле'
    },
    {
        fieldName: 'paid_arrivals',
        title: 'Оплаченные даты'
    },
    {
        fieldName: 'on_field',
        title: 'Статус',
        isDefault: true
    },
    {
        fieldName: 'is_blocked',
        title: '🚫 Заблокирован',
        isDefault: true
    },
    {
        fieldName: 'kitchen',
        title: 'Кухня',
        isDefault: true
    },
    {
        fieldName: 'printing_batch',
        title: 'Партия Бейджа'
    },
    {
        fieldName: 'supervisor',
        title: 'Бригадир'
    },
    {
        fieldName: 'comment',
        title: 'Комментарий',
        isDefault: true
    }
];
