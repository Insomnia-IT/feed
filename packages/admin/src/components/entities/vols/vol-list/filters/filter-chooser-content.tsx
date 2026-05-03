import { Select } from 'antd';

import type { FilterField } from './filter-types';
import styles from './filters.module.css';

interface IFilterOption {
    label: string;
    value: string;
}

const mapFilterFieldsToOptions = (item: FilterField): IFilterOption => ({
    label: item.title,
    value: item.name
});

export const FilterChooserContent = ({
    filterFields,
    removeAllFilters,
    selectOpen,
    setSelectOpen,
    toggleVisibleFilter,
    visibleFilters
}: {
    filterFields: Array<FilterField>;
    removeAllFilters: () => void;
    selectOpen: boolean;
    setSelectOpen: (open: boolean) => void;
    toggleVisibleFilter: (name: string) => void;
    visibleFilters: Array<string>;
}) => {
    const options = filterFields.map(mapFilterFieldsToOptions);

    const onChoiceChange = (_value: string, option: IFilterOption): void => {
        toggleVisibleFilter(option.value);
    };

    return (
        <Select
            open={selectOpen}
            onOpenChange={setSelectOpen}
            getPopupContainer={(trigger) =>
                trigger.closest('.ant-popover-inner-content') ?? trigger.parentElement ?? document.body
            }
            className={styles.filterChooserSelect}
            style={{ minWidth: '200px', maxWidth: '350px' }}
            mode="multiple"
            value={visibleFilters}
            options={options}
            optionFilterProp="label"
            onSelect={onChoiceChange}
            onDeselect={onChoiceChange}
            onClear={removeAllFilters}
            showSearch
            allowClear={false}
        />
    );
};
