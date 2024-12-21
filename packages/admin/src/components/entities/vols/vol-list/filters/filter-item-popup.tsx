import styles from '~/components/entities/vols/list.module.css';
import { Button, Input } from 'antd';
import { Checkbox, DatePicker, Radio } from '@pankod/refine-antd';
import { FilterField, FilterFieldType, FilterItem, FilterListItem } from './filter-types';
import dayjs from 'dayjs';
import { getFilterValueText } from '../volunteer-list-utils';
const { RangePicker } = DatePicker;

// Ввод значений в фильтр - календарь/ввод текста/один или несколько из списка
export const FilterItemPopup: React.FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterTextValueChange, onFilterValueChange }) => {
    const clearValue = (): void => {
        onFilterTextValueChange(field.name);
    };

    const onTextValueChange = (value?: string): void => onFilterTextValueChange(field.name, value);
    const onOtherValueChange = (filterListItem: FilterListItem): void =>
        onFilterValueChange(field.name, filterListItem, field.single);

    return (
        <div style={{ textAlign: 'center' }}>
            <FieldValueControlByType
                field={field}
                filterItem={filterItem}
                onOtherValueChange={onOtherValueChange}
                onTextValueChange={onTextValueChange}
            />

            {filterItem && (
                <Button type='link' onClick={clearValue} style={{ marginTop: 10 }}>
                    Сбросить
                </Button>
            )}
        </div>
    );
};

const FieldValueControlByType: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onTextValueChange: (value?: string) => void;
    onOtherValueChange: (filterListItem: FilterListItem) => void;
}> = ({ field, filterItem, onOtherValueChange, onTextValueChange }) => {
    switch (field.type) {
        case FilterFieldType.String:
        case FilterFieldType.Custom:
            return (
                <Input
                    value={filterItem?.value as string | undefined}
                    onChange={(e) => onTextValueChange(e.target.value)}
                    placeholder='Введите текст'
                    allowClear
                />
            );
        case FilterFieldType.Date:
            return <RangeField onTextValueChange={onTextValueChange} filterItem={filterItem} />;
        case FilterFieldType.Lookup:
        case FilterFieldType.Boolean:
            return <SeveralValues field={field} filterItem={filterItem} onOtherValueChange={onOtherValueChange} />;
        default:
            return null;
    }
};

const RangeField: FC<{
    filterItem?: FilterItem;
    onTextValueChange: (value?: string) => void;
}> = ({ filterItem, onTextValueChange }) => {
    const SEPARATOR = ':';

    // Ожидаем значение в формате YYYY-MM-DD:YYYY-MM-DD
    const [beforeString, afterString] = (filterItem?.value as string | undefined)?.split(SEPARATOR) ?? [];

    return (
        <RangePicker
            allowEmpty={[true, true]}
            style={{ width: 300 }}
            value={[dayjs(beforeString), dayjs(afterString)]}
            onChange={(value) => {
                // Сохраняем значение в формате YYYY-MM-DD:YYYY-MM-DD
                const periodString = (value ?? []).map((date) => date?.format('YYYY-MM-DD')).join(SEPARATOR);

                onTextValueChange(periodString);
            }}
        />
    );
};

// Выбор одного или нескольких элементов из списка
const SeveralValues: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onOtherValueChange: (filterListItem: FilterListItem) => void;
}> = ({ field, filterItem, onOtherValueChange }) => {
    const filterListItems = getFilterListItems(field, filterItem);

    return (
        <div className={styles.filterPopupList}>
            {filterListItems.map((filterListItem) => (
                <FilterValueListItem
                    key={filterListItem.text}
                    filterListItem={filterListItem}
                    onOtherValueChange={onOtherValueChange}
                    isSingle={field.single}
                />
            ))}
        </div>
    );
};

// Получение возможных значений для выбора из списка
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

    if (field.type === FilterFieldType.Boolean) {
        return [true, false].map((value) => ({
            value,
            text: getFilterValueText(field, value),
            selected: filterValues.includes(value),
            count: 0
        }));
    }

    return ['', 'notempty'].map((value) => ({
        value,
        text: getFilterValueText(field, value),
        selected: filterValues.includes(value),
        count: 0
    }));
};

// Элемент выпадающего списка значений фильтра
const FilterValueListItem: FC<{
    filterListItem: FilterListItem;
    onOtherValueChange: (filterListItem: FilterListItem) => void;
    isSingle?: boolean;
}> = ({ filterListItem, isSingle = false, onOtherValueChange }) => {
    return (
        <div
            className={styles.filterPopupListItem}
            key={filterListItem.text}
            onClick={() => onOtherValueChange(filterListItem)}
        >
            {isSingle ? (
                <Radio checked={filterListItem.selected} onChange={() => onOtherValueChange(filterListItem)} />
            ) : (
                <Checkbox checked={filterListItem.selected} onChange={() => onOtherValueChange(filterListItem)} />
            )}
            {filterListItem.text}
            {filterListItem.count > 0 && <span className={styles.filterListItemCount}>({filterListItem.count})</span>}
        </div>
    );
};
