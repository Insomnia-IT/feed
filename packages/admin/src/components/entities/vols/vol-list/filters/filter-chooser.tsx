import { useRef, useState } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { Button, Popover, Select } from 'antd';

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
    const selectRef = useRef<React.ComponentRef<typeof Select>>(null);
    const [selectOpen, setSelectOpen] = useState(false);
    const options = filterFields.map(mapFilterFieldsToOptions);

    const onChoiceChange = (_value: string, option: IFilterOption): void => {
        toggleVisibleFilter(option.value);
    };

    return (
        <Popover
            placement="bottomLeft"
            trigger="click"
            /* Убирает «зависшие» порталы/скроллбар списка Select после закрытия */
            destroyOnHidden
            afterOpenChange={(open) => {
                if (open) {
                    setSelectOpen(true);
                    selectRef.current?.focus();
                } else {
                    setSelectOpen(false);
                }
            }}
            content={
                <Select
                    ref={selectRef}
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
            }
        >
            <Button icon={<FilterOutlined />}>Фильтры</Button>
        </Popover>
    );
};
