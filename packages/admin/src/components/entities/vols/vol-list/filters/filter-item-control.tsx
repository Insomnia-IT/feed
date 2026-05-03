import { useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Input, Select } from 'antd';

import { DateFilterControl } from './date-filter-control';
import { FilterFieldType } from './filter-types';
import type { FilterField, FilterItem, FilterListItem } from './filter-types';
import { FilterFieldShell } from './filter-field-shell';
import { getFilterListItems } from './get-filter-list-items';
import { isEffectiveFilterValue } from './is-effective-filter-value';
import styles from './filters.module.css';

const INPUT_PLACEHOLDER = 'Введи текст';
const SELECT_PLACEHOLDER = 'Выбери из списка';

const stretchAndRingClass = (active: boolean): string | undefined =>
    [styles.volFilterControlStretch, active && styles.volActiveControlRing].filter(Boolean).join(' ') || undefined;

type FilterItemControlProps = {
    field: FilterField;
    filterItem?: FilterItem;
    isMobile?: boolean;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
};

export function FilterItemControl({
    field,
    filterItem,
    isMobile,
    onFilterTextValueChange,
    onFilterValueChange
}: FilterItemControlProps) {
    if (field.type === FilterFieldType.Lookup || field.type === FilterFieldType.Boolean) {
        return (
            <FilterSelect
                field={field}
                isMultiple={field.type === FilterFieldType.Lookup}
                filterItem={filterItem}
                isMobile={isMobile}
                onFilterTextValueChange={onFilterTextValueChange}
                onFilterValueChange={onFilterValueChange}
            />
        );
    }

    if (field.type === FilterFieldType.Date) {
        return (
            <DateFilterControl
                field={field}
                filterItem={filterItem}
                isMobile={isMobile}
                onFilterTextValueChange={onFilterTextValueChange}
            />
        );
    }

    return (
        <FilterInput
            field={field}
            filterItem={filterItem}
            isMobile={isMobile}
            onFilterTextValueChange={onFilterTextValueChange}
        />
    );
}

type FilterInputProps = {
    field: FilterField;
    filterItem?: FilterItem;
    isMobile?: boolean;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
};

function FilterInput({ field, filterItem, isMobile, onFilterTextValueChange }: FilterInputProps) {
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <FilterFieldShell isMobile={isMobile} title={field.title}>
            <div className={stretchAndRingClass(isEffectiveFilterValue(filterItem?.value))}>
                <Input
                    className={styles.filterControl}
                    value={filterItem?.value as string | undefined}
                    onChange={(e) => onFilterTextValueChange(field.name, e.target.value)}
                    placeholder={INPUT_PLACEHOLDER}
                    onClear={onClear}
                    allowClear
                />
            </div>
        </FilterFieldShell>
    );
}

type FilterSelectProps = {
    field: FilterField;
    isMultiple?: boolean;
    filterItem?: FilterItem;
    isMobile?: boolean;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
};

function FilterSelect({
    field,
    isMultiple,
    filterItem,
    isMobile,
    onFilterValueChange,
    onFilterTextValueChange
}: FilterSelectProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const values = getFilterListItems(field, filterItem);

    const rawStored = filterItem?.value;
    const selectValue = isMultiple
        ? Array.isArray(rawStored)
            ? rawStored
            : []
        : Array.isArray(rawStored)
          ? rawStored.length > 0
              ? rawStored[0]
              : undefined
          : undefined;

    const onSelect = (_value: string | number | boolean, option: FilterListItem) =>
        onFilterValueChange(field.name, { ...option, selected: false }, field.single);
    const onDeselect = (_value: string | number | boolean, option: FilterListItem) =>
        onFilterValueChange(field.name, { ...option, selected: true }, field.single);
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <FilterFieldShell isMobile={isMobile} title={field.title}>
            <div className={stretchAndRingClass(isEffectiveFilterValue(filterItem?.value))}>
                <Select
                    className={`${styles.filterValueSelect} ${styles.filterControl}`}
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                    maxTagCount={1}
                    value={selectValue as string[] | string | number | boolean | undefined}
                    onSelect={onSelect}
                    onDeselect={onDeselect}
                    onClear={onClear}
                    options={values}
                    placeholder={SELECT_PLACEHOLDER}
                    optionFilterProp="label"
                    mode={isMultiple ? 'multiple' : undefined}
                    showSearch
                    allowClear={false}
                    suffixIcon={
                        <span
                            role="button"
                            tabIndex={-1}
                            aria-expanded={dropdownOpen}
                            className={styles.filterIconToggle}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDropdownOpen((prev) => !prev);
                            }}
                        >
                            <DownOutlined />
                        </span>
                    }
                />
            </div>
        </FilterFieldShell>
    );
}
