import styles from 'components/entities/vols/list.module.css';
import { Button, Input } from 'antd';
import dayjs from 'dayjs';
import { Calendar, Checkbox, Radio } from '@pankod/refine-antd';

import { FilterField, FilterItem, FilterListItem } from './filter-types';
import { getFilterValueText } from './volunteer-list-utils';

const getFilterListItems = (field: FilterField, filterItem?: FilterItem): Array<FilterListItem> => {
    const filterValue = filterItem?.value;
    const filterValues = Array.isArray(filterValue) ? filterValue : [];

    const lookupItems = field.lookup?.();

    if (lookupItems) {
        return (field.skipNull ? lookupItems : [{ id: '', name: '(Пусто)' }, ...lookupItems]).map((item) => ({
            value: item.id,
            text: item.name,
            selected: filterValues.includes(item.id),
            count: 0
        }));
    }

    if (field.type === 'boolean') {
        return [true, false].map((value) => ({
            value,
            text: getFilterValueText(field, value),
            selected: filterValues.includes(value),
            count: 0
        }));
    } else {
        return ['', 'notempty'].map((value) => ({
            value,
            text: getFilterValueText(field, value),
            selected: filterValues.includes(value),
            count: 0
        }));
    }
};

export const FilterPopup: React.FC<{
    field: FilterField;
    activeFilters: Array<FilterItem>;
    onFilterTextValueChange: (field: FilterField, value: string | null) => void;
    onFilterValueChange: (field: FilterField, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ activeFilters, field, onFilterTextValueChange, onFilterValueChange }) => {
    const filterItem = activeFilters.find((f) => f.name === field.name);
    const filterListItems = getFilterListItems(field, filterItem);

    return (
        <div style={{ textAlign: 'center' }}>
            {(field.type === 'string' || field.type === 'custom') && (
                <Input
                    value={filterItem?.value as string}
                    onChange={(e) => onFilterTextValueChange(field, e.target.value)}
                    placeholder="Введите текст"
                    allowClear
                />
            )}
            {field.type === 'date' && (
                <Calendar
                    mode="month"
                    style={{ width: 300 }}
                    value={filterItem ? dayjs(filterItem.value as string) : undefined}
                    fullscreen={false}
                    onSelect={(value) => onFilterTextValueChange(field, value.format('YYYY-MM-DD'))}
                />
            )}
            {field.type !== 'string' && field.type !== 'date' && (
                <div className={styles.filterPopupList}>
                    {filterListItems.map((filterListItem) => {
                        return (
                            <div
                                className={styles.filterPopupListItem}
                                key={filterListItem.text}
                                onClick={() => onFilterValueChange(field, filterListItem, field.single)}
                            >
                                {field.single ? (
                                    <Radio
                                        checked={filterListItem.selected}
                                        onChange={() => onFilterValueChange(field, filterListItem, true)}
                                    />
                                ) : (
                                    <Checkbox
                                        checked={filterListItem.selected}
                                        onChange={() => onFilterValueChange(field, filterListItem)}
                                    />
                                )}
                                {filterListItem.text}
                                {filterListItem.count > 0 && (
                                    <span className={styles.filterListItemCount}>({filterListItem.count})</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {filterItem && (
                <Button type="link" onClick={() => onFilterTextValueChange(field, null)} style={{ marginTop: 10 }}>
                    Сбросить
                </Button>
            )}
        </div>
    );
};
