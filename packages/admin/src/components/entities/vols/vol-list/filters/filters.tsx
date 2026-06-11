import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Row, Spin } from 'antd';

import { FilterChooser } from './filter-chooser';
import type { FilterField, FilterItem, FilterListItem } from './filter-types';

import styles from './filters.module.css';

import { isEffectiveFilterValue } from './is-effective-filter-value';

const FilterItemControl = lazy(() =>
    import('./filter-item-control').then((module) => ({ default: module.FilterItemControl }))
);

interface IProps {
    filterFields: FilterField[];
    isMobile?: boolean;
    mobileSummary?: ReactNode;
    visibleFilters: string[];
    setVisibleFilters: (filters: string[]) => void;
    activeFilters: FilterItem[];
    setActiveFilters: (filters: FilterItem[]) => void;
}

export const Filters = ({
    activeFilters,
    filterFields,
    isMobile,
    mobileSummary,
    setActiveFilters,
    visibleFilters,
    setVisibleFilters
}: IProps) => {
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

            if (newValues.length === 0) {
                setActiveFilters(activeFilters.filter((f) => f.name !== fieldName));
                return;
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
    const activeFilterByName = useMemo(
        () => new Map(activeFilters.map((filter) => [filter.name, filter])),
        [activeFilters]
    );

    const filterPairs = useMemo(
        () =>
            visibleFiltersFields.map((field) => ({
                filterField: field,
                filterItem: activeFilterByName.get(field.name)
            })),
        [visibleFiltersFields, activeFilterByName]
    );

    const showClearFiltersButton = useMemo(
        () => activeFilters.some(({ value }) => isEffectiveFilterValue(value)),
        [activeFilters]
    );

    const resetFilters = () => {
        setActiveFilters([]);
    };

    return (
        <div className={styles.filters}>
            <div className={`${styles.filterItems} ${isMobile ? styles.filterItemsMobile : ''}`}>
                <div className={isMobile ? styles.mobileFiltersHeader : undefined}>
                    <Col className={styles.filterAddButtonCol}>
                        <Row>
                            <FilterChooser
                                removeAllFilters={removeAllFilters}
                                filterFields={filterFields}
                                toggleVisibleFilter={toggleVisibleFilter}
                                visibleFilters={visibleFilters}
                            />
                        </Row>
                    </Col>
                    {isMobile && mobileSummary && <div className={styles.mobileFiltersSummary}>{mobileSummary}</div>}
                </div>

                {filterPairs.map(({ filterField, filterItem }) => (
                    <Suspense key={filterField.name} fallback={<Spin />}>
                        <FilterItemControl
                            field={filterField}
                            filterItem={filterItem}
                            isMobile={isMobile}
                            onFilterTextValueChange={onFilterTextValueChange}
                            onFilterValueChange={onFilterValueChange}
                        />
                    </Suspense>
                ))}
                {showClearFiltersButton && (
                    <Button icon={<DeleteOutlined />} onClick={resetFilters}>
                        Очистить фильтры
                    </Button>
                )}
            </div>
        </div>
    );
};
