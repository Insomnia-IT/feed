import { Icons, Popover } from '@pankod/refine-antd';
import { Button } from 'antd';

import { FilterPopup } from '~/components/entities/vols/volList/filter-popup';

import styles from '../list.module.css';

import type { FilterField, FilterItem } from './filter-types';
import { FilterChooser } from './filter-chooser';
import { getFilterValueText } from '~/components/entities/vols/volList/volunteer-list-utils';

type FilterListItem = { selected: boolean; value: unknown; text: string; count: number };

export const Filters: FC<{
    filterFields: Array<FilterField>;
    setPage: (num: number) => void;
    searchText: string;
    setSearchText: (value: string) => void;
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
    const toggleVisibleFilter = (name: string) => {
        const visible = visibleFilters.includes(name);
        if (visible) {
            setVisibleFilters(visibleFilters.filter((currentName) => currentName !== name));
        } else {
            setVisibleFilters([...visibleFilters, name]);
        }
    };

    const onFilterTextValueChange = (field: FilterField, value: unknown): void => {
        const filterItem = activeFilters.find((f) => f.name === field.name);

        if (!value) {
            const newFilters = activeFilters.filter((f) => f.name !== field.name);
            setActiveFilters(newFilters);
        } else if (filterItem) {
            const newFilters = activeFilters
                .filter((f) => f.name !== field.name)
                .concat([
                    {
                        ...filterItem,
                        value
                    }
                ]);

            setActiveFilters(newFilters);
        } else {
            const newFilters = activeFilters.concat([
                {
                    name: field.name,
                    op: 'include',
                    value
                }
            ]);

            setActiveFilters(newFilters);
        }
    };

    const onFilterValueChange = (field: FilterField, filterListItem: FilterListItem, single = false): void => {
        const filterItem = activeFilters.find((f) => f.name === field.name);

        if (filterListItem.selected && !single) {
            if (filterItem && Array.isArray(filterItem.value)) {
                const newValues = filterItem.value.filter((value) => value !== filterListItem.value);
                const newFilters = activeFilters
                    .filter((f) => f.name !== field.name)
                    .concat(
                        newValues.length
                            ? [
                                  {
                                      ...filterItem,
                                      value: newValues
                                  }
                              ]
                            : []
                    );

                setActiveFilters(newFilters);
            }
        } else {
            if (filterItem && Array.isArray(filterItem.value)) {
                const newValues = single ? [filterListItem.value] : [...filterItem.value, filterListItem.value];
                const newFilters = activeFilters
                    .filter((f) => f.name !== field.name)
                    .concat([
                        {
                            ...filterItem,
                            value: newValues
                        }
                    ]);

                setActiveFilters(newFilters);
            } else {
                const newFilters = activeFilters.concat([
                    {
                        name: field.name,
                        op: 'include',
                        value: [filterListItem.value]
                    }
                ]);

                setActiveFilters(newFilters);
            }
        }
    };

    const renderFilterItemText = (field: FilterField) => {
        const filterItem = activeFilters.find((f) => f.name == field.name);

        if (!filterItem) {
            return <span>{field.title}</span>;
        }

        return (
            <span className={styles.filterItemActive}>
                <span className={styles.filterItemNameActive}>{field.title}:</span>
                &nbsp;
                <span>
                    {(Array.isArray(filterItem.value) ? filterItem.value : [filterItem.value])
                        .map((value) => getFilterValueText(field, value))
                        .join(', ')}
                </span>
            </span>
        );
    };

    return (
        <div className={styles.filters}>
            <div className={styles.filterItems}>
                {filterFields
                    .filter((field) => visibleFilters.includes(field.name))
                    .map((field) => {
                        return (
                            <Popover
                                key={field.name}
                                placement='bottomLeft'
                                content={
                                    <FilterPopup
                                        field={field}
                                        activeFilters={activeFilters}
                                        onFilterTextValueChange={onFilterTextValueChange}
                                        onFilterValueChange={onFilterValueChange}
                                    />
                                }
                                overlayInnerStyle={{ borderRadius: 0 }}
                                trigger='click'
                            >
                                <Button className={styles.filterItemButton}>
                                    {renderFilterItemText(field)}
                                    <span className={styles.filterDownIcon}>
                                        <Icons.DownOutlined />
                                    </span>
                                </Button>
                            </Popover>
                        );
                    })}
                <Popover
                    key='add-filter'
                    placement='bottomLeft'
                    content={
                        <FilterChooser
                            filterFields={filterFields}
                            toggleVisibleFilter={toggleVisibleFilter}
                            visibleFilters={visibleFilters}
                        />
                    }
                    overlayInnerStyle={{ borderRadius: 0 }}
                    trigger='click'
                >
                    <Button type='link' icon={<Icons.PlusOutlined />}>
                        Фильтр
                    </Button>
                </Popover>
                {(activeFilters.length || searchText) && (
                    <Button
                        type='link'
                        icon={<Icons.DeleteOutlined />}
                        onClick={() => {
                            setActiveFilters([]);
                            setSearchText('');
                        }}
                    >
                        Сбросить фильтрацию
                    </Button>
                )}
            </div>
        </div>
    );
};
