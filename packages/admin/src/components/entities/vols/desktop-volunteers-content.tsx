import { useEffect, useMemo } from 'react';
import { Row, Col } from 'antd';
import { useList } from '@refinedev/core';
import type { TablePaginationConfig } from 'antd/es/table';

import type { CustomFieldEntity, VolEntity } from 'interfaces';
import type { FilterItem } from 'components/entities/vols/vol-list/filters/filter-types';
import { isEffectiveFilterValue } from 'components/entities/vols/vol-list/filters/is-effective-filter-value';
import { SaveAsXlsxButton } from './vol-list/save-as-xlsx-button';
import { ChooseColumnsButton } from './vol-list/choose-columns-button';
import { VolunteerDesktopTable } from './vol-list/volunteer-desktop-table/volunteer-desktop-table';
import { useMassEdit } from './vol-list/mass-edit/use-mass-edit';
import { MassEdit } from './vol-list/mass-edit/mass-edit';
import { PersonsTable } from './vol-list/persons-table';

type DesktopVolunteersContentProps = {
    page: number;
    pageSize: number;
    setPageWithStorage: (value: number) => void;
    setPageSizeWithStorage: (value: number) => void;
    effectiveFilterQueryParams: string;
    statusById: Record<string, string>;
    customFields: Array<CustomFieldEntity>;
    canBulkEdit: boolean;
    canListCustomFields: boolean;
    isFiltersLoading: boolean;
    searchText: string;
    activeFilters: FilterItem[];
    openVolunteer: (id: number) => Promise<boolean>;
};

export const DesktopVolunteersContent = ({
    page,
    pageSize,
    setPageWithStorage,
    setPageSizeWithStorage,
    effectiveFilterQueryParams,
    statusById,
    customFields,
    canBulkEdit,
    canListCustomFields,
    isFiltersLoading,
    searchText,
    activeFilters,
    openVolunteer
}: DesktopVolunteersContentProps) => {
    const { result: volunteersResult, query: volunteersQuery } = useList<VolEntity>({
        resource: `volunteers/${effectiveFilterQueryParams}`,
        pagination: {
            mode: 'server',
            currentPage: page,
            pageSize
        }
    });
    const volunteers = volunteersResult;
    const volunteersIsLoading = volunteersQuery.isLoading;
    const reloadVolunteers = volunteersQuery.refetch;

    useEffect(() => {
        const total = volunteers?.total;
        if (!total) return;

        const outOfRange = (page - 1) * pageSize >= total;
        if (!outOfRange) return;

        setPageWithStorage(1);
    }, [volunteers?.total, page, pageSize, setPageWithStorage]);

    const { selectedVols, unselectAllSelected, unselectVolunteer, rowSelection, reloadSelectedVolunteers } =
        useMassEdit({
            totalVolunteersCount: volunteers?.total ?? 0,
            filterQueryParams: effectiveFilterQueryParams
        });

    const pagination = useMemo<TablePaginationConfig>(
        () => ({
            total: volunteers?.total ?? 0,
            showTotal: (total) => (
                <>
                    <span data-testid="volunteer-count-caption">Волонтёров:</span>{' '}
                    <span data-testid="volunteer-count-value">{total}</span>
                </>
            ),
            hideOnSinglePage: false,
            current: page,
            pageSize,
            showSizeChanger: true,
            onChange: (newPage, newSize) => {
                setPageWithStorage(newPage);
                setPageSizeWithStorage(newSize);
            }
        }),
        [volunteers?.total, page, pageSize, setPageWithStorage, setPageSizeWithStorage]
    );

    const noEffectiveFilters = !activeFilters.some(({ value }) => isEffectiveFilterValue(value));
    const volunteersData = volunteers?.data ?? [];
    const showPersons = !!searchText && noEffectiveFilters && volunteersData.length === 0;

    return (
        <>
            <Row style={{ padding: '10px 0', gap: '24px' }} justify="end">
                <Col style={{ display: 'flex', alignItems: 'center' }}>
                    <span>
                        <b>Результат:</b> <span data-testid="volunteer-count">{volunteers?.total}</span> волонтеров
                    </span>
                </Col>

                <Row style={{ gap: '12px' }}>
                    <ChooseColumnsButton canListCustomFields={canListCustomFields} />
                    <SaveAsXlsxButton
                        isDisabled={!volunteersData.length || isFiltersLoading}
                        filterQueryParams={effectiveFilterQueryParams}
                    />
                </Row>
            </Row>

            {!showPersons && (
                <VolunteerDesktopTable
                    openVolunteer={openVolunteer}
                    pagination={pagination}
                    statusById={statusById}
                    volunteersIsLoading={volunteersIsLoading}
                    volunteersData={volunteersData}
                    customFields={customFields}
                    rowSelection={canBulkEdit ? rowSelection : undefined}
                />
            )}
            {showPersons && <PersonsTable key={searchText} searchText={searchText} />}
            {canBulkEdit && (
                <MassEdit
                    selectedVolunteers={selectedVols}
                    unselectAll={unselectAllSelected}
                    unselectVolunteer={unselectVolunteer}
                    reloadVolunteers={async () => {
                        await reloadVolunteers();
                        await reloadSelectedVolunteers();
                    }}
                />
            )}
        </>
    );
};
