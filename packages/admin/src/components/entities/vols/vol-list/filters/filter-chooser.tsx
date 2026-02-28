import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Select } from 'antd';

import type { FilterField } from './filter-types';
import styles from '../../list.module.css';

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

export const FilterChooser: React.FC<{
    removeAllFilters: () => void;
    filterFields: Array<FilterField>;
    toggleVisibleFilter: (name: string) => void;
    visibleFilters: Array<string>;
}> = ({ removeAllFilters, filterFields, toggleVisibleFilter, visibleFilters }) => {
    const options = filterFields.map(mapFilterFieldsToOptions);

    const onChange = (_id: string, item: IFilterOption): void => {
        toggleVisibleFilter(item.value);
    };

    return (
        <Select
            className={styles.filterChooserSelect}
            style={{ minWidth: '200px', maxWidth: '350px' }}
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
            suffixIcon={<DownOutlined />}
        />
    );
};
