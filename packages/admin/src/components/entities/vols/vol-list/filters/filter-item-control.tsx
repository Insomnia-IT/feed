import { Button, Popover } from 'antd';
import { FilterField, FilterItem, FilterListItem } from './filter-types';
import { FilterItemPopup } from './filter-item-popup';
import { getFilterValueText } from 'components/entities/vols/vol-list/volunteer-list-utils';
import { FC } from 'react';

import { DownOutlined } from '@ant-design/icons';

import styles from 'components/entities/vols/list.module.css';

export const FilterItemControl: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterTextValueChange, onFilterValueChange }) => {
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
