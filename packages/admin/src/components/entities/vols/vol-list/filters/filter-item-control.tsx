import { FC } from 'react';
import { Button, Input, Popover, Select } from 'antd';
import { FilterItemPopup } from './filter-item-popup';
import { FilterField, FilterFieldType, FilterItem, FilterListItem } from './filter-types';
import { getFilterValueText } from 'components/entities/vols/vol-list/volunteer-list-utils';

import { DownOutlined } from '@ant-design/icons';

import styles from 'components/entities/vols/list.module.css';
import { getFilterListItems } from './get-filter-list-items';

export const FilterItemControl: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterTextValueChange, onFilterValueChange }) => {
    if (field.type === FilterFieldType.Lookup) {
        return (
            <FilterSelect
                field={field}
                filterItem={filterItem}
                onFilterTextValueChange={onFilterTextValueChange}
                onFilterValueChange={onFilterValueChange}
            />
        );
    }

    if (field.type === FilterFieldType.String || field.type === FilterFieldType.Custom) {
        return (
            <FilterInput
                field={field}
                filterItem={filterItem}
                onFilterTextValueChange={onFilterTextValueChange}
                onFilterValueChange={onFilterValueChange}
            />
        );
    }

    return (
        <Popover
            placement="bottomLeft"
            content={
                <FilterItemPopup
                    field={field}
                    filterItem={filterItem}
                    onFilterTextValueChange={onFilterTextValueChange}
                    onFilterValueChange={onFilterValueChange}
                />
            }
            styles={{ body: { borderRadius: 0 } }}
            trigger="click"
        >
            <Button className={styles.filterItemButton}>
                <FilterItemText field={field} filterItem={filterItem} />
                <span className={styles.filterDownIcon}>
                    <DownOutlined />
                </span>
            </Button>
        </Popover>
    );
};

const FilterItemText: FC<{
    field: FilterField;
    filterItem?: FilterItem;
}> = ({ field, filterItem }) => {
    if (!filterItem) {
        return <span>{field.title}</span>;
    }

    const valueToShow = (Array.isArray(filterItem.value) ? filterItem.value : [filterItem.value])
        .map((value) => getFilterValueText(field, value))
        .join(', ');

    return (
        <span className={styles.filterItemActive}>
            <span className={styles.filterItemNameActive}>{field.title}:</span>
            &nbsp;
            <span className={styles.filterItemValue}>{valueToShow}</span>
        </span>
    );
};

const FilterInput: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterTextValueChange }) => {
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <Input
            style={{ width: 330 }}
            value={filterItem?.value as string | undefined}
            onChange={(e) => onFilterTextValueChange(field.name, e.target.value)}
            prefix={<>{field.title}:</>}
            placeholder={'Введите текст'}
            onClear={onClear}
            allowClear
        />
    );
};

const FilterSelect: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterValueChange, onFilterTextValueChange }) => {
    const values = getFilterListItems(field, filterItem);

    const onChange = (_id: string, value: FilterListItem) => onFilterValueChange(field.name, value, field.single);
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <Select
            style={{ width: 330 }}
            maxTagCount="responsive"
            prefix={<>{field.title}:</>}
            onSelect={onChange}
            onDeselect={onChange}
            onClear={onClear}
            options={values}
            optionFilterProp={'label'}
            mode="multiple"
            showSearch
            allowClear
        />
    );
};
