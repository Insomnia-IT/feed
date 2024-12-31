import { Button, Icons, Popover } from '@pankod/refine-antd';
import { FilterField, FilterItem, FilterListItem } from './filter-types';
import { FilterItemPopup } from './filter-item-popup';
import styles from 'components/entities/vols/list.module.css';
import { getFilterValueText } from 'components/entities/vols/vol-list/volunteer-list-utils';
import { FC } from 'react';

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
            overlayInnerStyle={{ borderRadius: 0 }}
            trigger="click"
        >
            <Button className={styles.filterItemButton}>
                <FilterItemText field={field} filterItem={filterItem} />
                <span className={styles.filterDownIcon}>
                    <Icons.DownOutlined />
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
            <span>{valueToShow}</span>
        </span>
    );
};
