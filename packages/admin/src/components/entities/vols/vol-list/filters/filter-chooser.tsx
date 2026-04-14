import { useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Select } from 'antd';

import type { FilterField } from './filter-types';
import styles from './filters.module.css';

interface IFilterOption {
    label: string;
    value: string;
}

const mapFilterFieldsToOptions = (item: FilterField): IFilterOption => {
    return {
        label: item.title,
        value: item.name
    };
};

export const FilterChooser = ({
    removeAllFilters,
    filterFields,
    toggleVisibleFilter,
    visibleFilters
}: {
    removeAllFilters: () => void;
    filterFields: Array<FilterField>;
    toggleVisibleFilter: (name: string) => void;
    visibleFilters: Array<string>;
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const options = filterFields.map(mapFilterFieldsToOptions);

    const onChange = (_id: string, item: IFilterOption): void => {
        toggleVisibleFilter(item.value);
    };

    return (
        <Select
            className={`${styles.filterChooserSelect} ${styles.filterChooser}`}
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            mode={'multiple'}
            value={visibleFilters}
            autoFocus={true}
            options={options}
            optionFilterProp={'label'}
            onSelect={onChange}
            onDeselect={onChange}
            onClear={removeAllFilters}
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
    );
};
