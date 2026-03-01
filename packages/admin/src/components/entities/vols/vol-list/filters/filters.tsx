import { FC, useMemo } from 'react';
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Col, Popover, Row } from 'antd';

import { FilterChooser } from './filter-chooser';
import { FilterItemControl } from './filter-item-control';
import type { FilterField, FilterItem, FilterListItem } from './filter-types';

import styles from '../../list.module.css';

interface IProps {
    filterFields: FilterField[];
    searchText?: string;
    setSearchText?: (value: string) => void;
    visibleFilters: string[];
    setVisibleFilters: (filters: string[]) => void;
    activeFilters: FilterItem[];
    setActiveFilters: (filters: FilterItem[]) => void;
}

export const Filters: FC<IProps> = ({
    activeFilters,
    filterFields,
    searchText,
    setSearchText,
    setActiveFilters,
    visibleFilters,
    setVisibleFilters
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

    const removeAllFilters = () => {
        setVisibleFilters([]);
        setActiveFilters([]);
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

        if (filterItem && Array.isArray(filterItem.value)) {
            let newValues: unknown[];

            if (filterListItem.selected) {
                // Снятие выбора (клик по крестику): удаляем значение
                newValues = filterItem.value.filter((value) => value !== filterListItem.value);
            } else if (single) {
                newValues = [filterListItem.value];
            } else {
                newValues = [...filterItem.value, filterListItem.value];
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

    const visibleFiltersFields = useMemo(
        () => filterFields.filter((f) => visibleFilters.includes(f.name)),
        [filterFields, visibleFilters]
    );

    const filterPairs = useMemo(
        () =>
            visibleFiltersFields.map((field) => ({
                filterField: field,
                filterItem: activeFilters.find((f) => f.name === field.name)
            })),
        [visibleFiltersFields, activeFilters]
    );

    const resetFilters = () => {
        setActiveFilters([]);

        if (setSearchText) {
            setSearchText('');
        }
    };

    return (
        <div className={styles.filters}>
            <div className={styles.filterItems}>
                <Col style={{ width: '105px' }}>
                    <Row>
                        <Popover
                            key="add-filter"
                            placement="bottomLeft"
                            content={
                                <FilterChooser
                                    removeAllFilters={removeAllFilters}
                                    filterFields={filterFields}
                                    toggleVisibleFilter={toggleVisibleFilter}
                                    visibleFilters={visibleFilters}
                                />
                            }
                            trigger="click"
                        >
                            <Button icon={<FilterOutlined />}>Фильтры</Button>
                        </Popover>
                    </Row>
                </Col>
                {filterPairs.map(({ filterField, filterItem }) => (
                    <FilterItemControl
                        key={filterField.name}
                        field={filterField}
                        filterItem={filterItem}
                        onFilterTextValueChange={onFilterTextValueChange}
                        onFilterValueChange={onFilterValueChange}
                    />
                ))}
                {(activeFilters.length || searchText) && (
                    <Button icon={<DeleteOutlined />} onClick={resetFilters}>
                        Очистить фильтры
                    </Button>
                )}
            </div>
        </div>
    );
};
