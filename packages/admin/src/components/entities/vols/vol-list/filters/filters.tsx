import { Button, Popover } from 'antd';

import styles from '../../list.module.css';
import { FC } from 'react';

import type { FilterField, FilterListItem } from './filter-types';
import { FilterItem } from './filter-types';
import { FilterChooser } from './filter-chooser';
import { FilterItemControl } from './filter-item-control';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export const Filters: FC<{
    /** Available filer fields */
    filterFields: Array<FilterField>;
    searchText?: string;
    setSearchText?: (value: string) => void;
    visibleFilters: Array<string>;
    setVisibleFilters: (value: Array<string>) => void;
    activeFilters: Array<FilterItem>;
    setActiveFilters: (value: Array<FilterItem>) => void;
}> = ({
    activeFilters,
    filterFields,
    searchText,
    setActiveFilters,
    setSearchText,
    setVisibleFilters,
    visibleFilters
}) => {
    const toggleVisibleFilter = (name: string): void => {
        const visible = visibleFilters.includes(name);
        if (visible) {
            setVisibleFilters(visibleFilters.filter((currentName: string): boolean => currentName !== name));

            // При скрытии фильтра, очищаем его значение
            setActiveFilters(activeFilters.filter((filterItem: FilterItem): boolean => filterItem.name !== name));
        } else {
            setVisibleFilters([...visibleFilters, name]);
        }
    };

    const onFilterTextValueChange = (fieldName: string, value?: string): void => {
        const filterItem = activeFilters.find((filterItem: FilterItem): boolean => filterItem.name === fieldName);

        if (!value) {
            const newFilters = activeFilters.filter((filterItem: FilterItem): boolean => filterItem.name !== fieldName);
            setActiveFilters(newFilters);

            return;
        }

        if (filterItem) {
            const newFilters = activeFilters
                .filter((f) => f.name !== fieldName)
                .concat([
                    {
                        ...filterItem,
                        value
                    }
                ]);

            setActiveFilters(newFilters);

            return;
        }

        const newFilters = activeFilters.concat([
            {
                name: fieldName,
                op: 'include',
                value
            }
        ]);

        setActiveFilters(newFilters);
    };

    const onFilterValueChange = (fieldName: string, filterListItem: FilterListItem, single = false): void => {
        const filterItem = activeFilters.find((f) => f.name === fieldName);

        console.log(filterItem, fieldName, filterListItem, single);

        if (filterItem && Array.isArray(filterItem.value)) {
            let newValues = single ? [filterListItem.value] : [...filterItem.value, filterListItem.value];

            if (filterListItem.selected && !single) {
                newValues = filterItem.value.filter((value) => value !== filterListItem.value);
            }

            const newFilters = activeFilters
                .filter((f) => f.name !== fieldName)
                .concat([
                    {
                        ...filterItem,
                        value: newValues
                    }
                ]);

            setActiveFilters(newFilters);

            return;
        }

        const newFilters = activeFilters.concat([
            {
                name: fieldName,
                op: 'include',
                value: [filterListItem.value]
            }
        ]);

        setActiveFilters(newFilters);
    };

    const visibleFiltersFields = filterFields.filter((field) => visibleFilters.includes(field.name));

    const filterPairs = visibleFiltersFields.map((filterField) => {
        const filterItem = activeFilters.find((f) => f.name === filterField.name);

        return {
            filterField,
            filterItem
        };
    });

    return (
        <div className={styles.filters}>
            <div className={styles.filterItems}>
                {filterPairs.map(({ filterField, filterItem }) => (
                    <FilterItemControl
                        key={filterField.name}
                        field={filterField}
                        filterItem={filterItem}
                        onFilterTextValueChange={onFilterTextValueChange}
                        onFilterValueChange={onFilterValueChange}
                    />
                ))}
                <Popover
                    key="add-filter"
                    placement="bottomLeft"
                    content={
                        <FilterChooser
                            filterFields={filterFields}
                            toggleVisibleFilter={toggleVisibleFilter}
                            visibleFilters={visibleFilters}
                        />
                    }
                    trigger="click"
                >
                    <Button type="link" icon={<PlusOutlined />}>
                        Фильтр
                    </Button>
                </Popover>
                {(activeFilters.length || searchText) && (
                    <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            setActiveFilters([]);
                            if (setSearchText) {
                                setSearchText('');
                            }
                        }}
                    >
                        Сбросить фильтрацию
                    </Button>
                )}
            </div>
        </div>
    );
};
