import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { DownOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Popover, Select } from 'antd';

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
    isMobile,
    toggleVisibleFilter,
    visibleFilters
}: {
    removeAllFilters: () => void;
    filterFields: Array<FilterField>;
    isMobile?: boolean;
    toggleVisibleFilter: (name: string) => void;
    visibleFilters: Array<string>;
}) => {
    const selectRef = useRef<ComponentRef<typeof Select>>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);
    const options = filterFields.map(mapFilterFieldsToOptions);

    useEffect(() => {
        if (!isMobile || !popoverOpen) return;

        const scrollY = window.scrollY;
        const previousBodyOverflow = document.body.style.overflow;
        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyWidth = document.body.style.width;
        const previousDocumentOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.width = previousBodyWidth;
            document.documentElement.style.overflow = previousDocumentOverflow;
            window.scrollTo({ top: scrollY });
        };
    }, [isMobile, popoverOpen]);

    const onChoiceChange = (_value: string, option: IFilterOption): void => {
        toggleVisibleFilter(option.value);
    };

    return (
        <Popover
            placement="bottomLeft"
            trigger="click"
            destroyOnHidden
            classNames={{ root: styles.filterChooserPopover }}
            onOpenChange={setPopoverOpen}
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
                    classNames={{ popup: { root: styles.filterChooserPopup } }}
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
                    suffixIcon={
                        <span
                            role="button"
                            tabIndex={-1}
                            aria-expanded={selectOpen}
                            className={styles.filterIconToggle}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectOpen((prev) => !prev);
                            }}
                        >
                            <DownOutlined />
                        </span>
                    }
                />
            }
        >
            <Button icon={<FilterOutlined />}>Фильтры</Button>
        </Popover>
    );
};
