import { FC, useEffect, useMemo, useState } from 'react';
import { useNavigation, useList, CanAccess } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { Input, Row, Col } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';

import { dataProvider } from 'dataProvider';
import { useScreen } from 'shared/providers';
import useCanAccess from './use-can-access';

import { CustomFieldEntity, VolEntity } from 'interfaces';

import { Filters } from './vol-list/filters/filters';
import { useFilters } from 'components/entities/vols/vol-list/filters/use-filters';
import { SaveAsXlsxButton } from './vol-list/save-as-xlsx-button';
import { ChooseColumnsButton } from './vol-list/choose-columns-button';
import { VolunteerDesktopTable } from './vol-list/volunteer-desktop-table';
import { VolunteerMobileList } from './vol-list/volunteer-mobile-list';
import { ActiveColumnsContextProvider } from './vol-list/active-columns-context';
import { useMassEdit } from './vol-list/mass-edit/use-mass-edit';
import { MassEdit } from './vol-list/mass-edit/mass-edit';
import { PersonsTable } from './vol-list/persons-table';

export const VolList: FC = () => {
    const { isDesktop } = useScreen();
    const { edit } = useNavigation();

    const [page, setPage] = useState<number>(parseFloat(localStorage.getItem('volPageIndex') || '') || 1);
    const [pageSize, setPageSize] = useState<number>(parseFloat(localStorage.getItem('volPageSize') || '') || 10);
    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const canListCustomFields = useCanAccess({
        action: 'list',
        resource: 'volunteer-custom-fields'
    });
    const canBulkEdit = useCanAccess({ action: 'bulk_edit', resource: 'volunteers' });

    const {
        accessRoleById,
        activeFilters,
        feedTypeNameById,
        filterFields,
        filterQueryParams,
        isFiltersLoading,
        kitchenNameById,
        searchText,
        setActiveFilters,
        setSearchText,
        setVisibleFilters,
        statusById,
        transportById,
        visibleFilters,
        volunteerRoleById
    } = useFilters({
        setPage,
        customFields
    });

    const {
        data: volunteers,
        isLoading: volunteersIsLoading,
        refetch: reloadVolunteers
    } = useList<VolEntity>({
        resource: `volunteers/${filterQueryParams}`,
        pagination: isDesktop ? { current: page, pageSize } : undefined
    });

    const volunteersData = volunteers?.data ?? [];

    const { selectedVols, unselectAllSelected, unselectVolunteer, rowSelection, reloadSelectedVolunteers } =
        useMassEdit({
            totalVolunteersCount: volunteers?.total ?? 0,
            filterQueryParams
        });

    const pagination = useMemo<TablePaginationConfig>(
        () => ({
            total: volunteers?.total ?? 1,
            showTotal: (total) => (
                <>
                    <span data-testid="volunteer-count-caption">Волонтеров:</span>{' '}
                    <span data-testid="volunteer-count-value">{total}</span>
                </>
            ),
            current: page,
            pageSize,
            onChange: (newPage, newSize) => {
                setPage(newPage);
                setPageSize(newSize);
                localStorage.setItem('volPageIndex', newPage.toString());
                localStorage.setItem('volPageSize', newSize.toString());
            }
        }),
        [volunteers?.total, page, pageSize]
    );

    const loadCustomFields = async () => {
        const { data } = await dataProvider.getList<CustomFieldEntity>({
            resource: 'volunteer-custom-fields'
        });

        setCustomFields(data);
    };

    useEffect(() => {
        void loadCustomFields();

        const savedPage = parseFloat(localStorage.getItem('volPageIndex') || '') || 1;
        setPage(savedPage);
    }, []);

    const openVolunteer = (id: number) => {
        edit('volunteers', id);
        return Promise.resolve(true);
    };

    const noActiveFilters = activeFilters.length === 0;
    const showPersons = !!searchText && noActiveFilters && volunteersData.length === 0;

    return (
        <List canCreate={noActiveFilters}>
            <CanAccess fallback="У вас нет доступа к этой странице">
                <ActiveColumnsContextProvider customFields={customFields}>
                    <Input
                        placeholder="Поиск по волонтерам, датам, службам"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                    <Filters
                        activeFilters={activeFilters}
                        setActiveFilters={setActiveFilters}
                        visibleFilters={visibleFilters}
                        setVisibleFilters={setVisibleFilters}
                        filterFields={filterFields}
                        searchText={searchText}
                        setSearchText={setSearchText}
                    />
                    <Row style={{ padding: '10px 0' }} justify="space-between">
                        {isDesktop ? (
                            <>
                                <Row style={{ gap: 24 }} align="middle">
                                    <Col>
                                        <b>Результат:</b> <span data-testid="volunteer-count">{volunteers?.total}</span>{' '}
                                        волонтеров
                                    </Col>
                                    <Row style={{ gap: 12 }} align="middle">
                                        <ChooseColumnsButton
                                            canListCustomFields={canListCustomFields}
                                            customFields={customFields}
                                        />
                                        <SaveAsXlsxButton
                                            isDisabled={!volunteersData.length || isFiltersLoading}
                                            filterQueryParams={filterQueryParams}
                                            customFields={customFields}
                                            volunteerRoleById={volunteerRoleById}
                                            statusById={statusById}
                                            transportById={transportById}
                                            kitchenNameById={kitchenNameById}
                                            feedTypeNameById={feedTypeNameById}
                                            accessRoleById={accessRoleById}
                                        />
                                    </Row>
                                </Row>
                            </>
                        ) : (
                            <span>Найдено: {volunteers?.total ?? 0}</span>
                        )}
                    </Row>

                    {isDesktop ? (
                        <>
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
                            {showPersons && <PersonsTable searchText={searchText} />}
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
                    ) : (
                        <VolunteerMobileList
                            filterQueryParams={filterQueryParams}
                            statusById={statusById}
                            openVolunteer={openVolunteer}
                        />
                    )}
                </ActiveColumnsContextProvider>
            </CanAccess>
        </List>
    );
};
