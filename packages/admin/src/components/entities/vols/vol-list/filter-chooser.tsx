import { Checkbox } from '@pankod/refine-antd';

import styles from '../list.module.css';

import type { FilterField } from './filter-types';

export const FilterChooser: React.FC<{
    filterFields: Array<FilterField>;
    toggleVisibleFilter: (name: string) => void;
    visibleFilters: Array<string>;
}> = ({ filterFields, toggleVisibleFilter, visibleFilters }) => {
    return (
        <div className={styles.filterPopupList}>
            {filterFields.map((filterField) => {
                return (
                    <div
                        className={styles.filterPopupListItem}
                        key={filterField.title}
                        onClick={() => toggleVisibleFilter(filterField.name)}
                    >
                        <Checkbox
                            checked={visibleFilters.includes(filterField.name)}
                            onChange={() => toggleVisibleFilter(filterField.name)}
                        />
                        {filterField.title}
                    </div>
                );
            })}
        </div>
    );
};
