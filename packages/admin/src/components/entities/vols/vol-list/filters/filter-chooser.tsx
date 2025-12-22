import React from 'react';
import { Select } from 'antd';

import type { FilterField } from './filter-types';

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
            mode={'multiple'}
            style={{ width: '200px' }}
            value={visibleFilters}
            autoFocus={true}
            options={options}
            optionFilterProp={'label'}
            onSelect={onChange}
            onDeselect={onChange}
            onClear={removeAllFilters}
            showSearch
            allowClear
        />
    );
};
