import { FilterField, FilterFieldType, FilterItem, FilterListItem } from './filter-types';
import { getFilterValueText } from '../volunteer-list-utils';

// Получение возможных значений для выбора из списка
export const getFilterListItems = (field: FilterField, filterItem?: FilterItem): Array<FilterListItem> => {
    const filterValue = filterItem?.value;
    const filterValues = Array.isArray(filterValue) ? filterValue : [];

    const lookupItems = field.lookup?.();

    if (lookupItems) {
        return (field.skipNull ? lookupItems : [{ id: '', name: '(Пусто)' }, ...lookupItems]).map((item) => ({
            value: item.id,
            text: item.name,
            label: item.name,
            selected: filterValues.includes(item.id),
            count: 0
        }));
    }

    if (field.type === FilterFieldType.Boolean) {
        return [true, false].map((value) => ({
            value,
            text: getFilterValueText(field, value),
            label: getFilterValueText(field, value),
            selected: filterValues.includes(value),
            count: 0
        }));
    }

    return ['', 'notempty'].map((value) => ({
        value,
        text: getFilterValueText(field, value),
        label: getFilterValueText(field, value),
        selected: filterValues.includes(value),
        count: 0
    }));
};
