import { lazy, Suspense, useState } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { Button, Popover, Spin } from 'antd';

import type { FilterField } from './filter-types';

const FilterChooserContent = lazy(() =>
    import('./filter-chooser-content').then((module) => ({ default: module.FilterChooserContent }))
);

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
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);

    return (
        <Popover
            placement="bottomLeft"
            trigger="click"
            open={popoverOpen}
            onOpenChange={(open) => {
                setPopoverOpen(open);
                setSelectOpen(open);
            }}
            destroyOnHidden
            content={
                popoverOpen ? (
                    <Suspense fallback={<Spin />}>
                        <FilterChooserContent
                            filterFields={filterFields}
                            removeAllFilters={removeAllFilters}
                            selectOpen={selectOpen}
                            setSelectOpen={setSelectOpen}
                            toggleVisibleFilter={toggleVisibleFilter}
                            visibleFilters={visibleFilters}
                        />
                    </Suspense>
                ) : null
            }
        >
            <Button icon={<FilterOutlined />}>Фильтры</Button>
        </Popover>
    );
};
