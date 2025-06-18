import { useNavigation, useList, CanAccess } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { Input, Row, Col } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { FC, useEffect, useState } from 'react';

import { CustomFieldEntity, VolEntity } from 'interfaces';
import { dataProvider } from 'dataProvider';
import { useMedia } from 'shared/providers';

import { Filters } from './vol-list/filters/filters';
import { SaveAsXlsxButton } from './vol-list/save-as-xlsx-button';
import { VolunteerDesktopTable } from './vol-list/volunteer-desktop-table';
import { VolunteerMobileList } from './vol-list/volunteer-mobile-list';
import useCanAccess from './use-can-access';

import { ChooseColumnsButton } from './vol-list/choose-columns-button';
import { ActiveColumnsContextProvider } from './vol-list/active-columns-context';
import { useFilters } from 'components/entities/vols/vol-list/filters/use-filters';
import { useMassEdit } from './vol-list/mass-edit/use-mass-edit';
import { MassEdit } from './vol-list/mass-edit/mass-edit';
import { PersonsTable } from './vol-list/persons-table';

export const VolList: FC = () => {
    const [page, setPage] = useState<number>(parseFloat(localStorage.getItem('volPageIndex') || '') || 1);
    const [pageSize, setPageSize] = useState<number>(parseFloat(localStorage.getItem('volPageSize') || '') || 10);
    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);
    const { isDesktop, isMobile } = useMedia();

    const canListCustomFields = useCanAccess({
        action: 'list',
        resource: 'volunteer-custom-fields'
    });
    const canBulkEdit = useCanAccess({ action: 'bulk_edit', resource: 'volunteers' });

    const { edit } = useNavigation();

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

        pagination: {
            current: isMobile ? 1 : page,
            pageSize: isMobile ? 10000 : pageSize
        }
    });

    const { selectedVols, unselectAllSelected, unselectVolunteer, rowSelection } = useMassEdit({
        volunteersData: volunteers?.data ?? [],
        totalVolunteersCount: volunteers?.total ?? 0,
        filterQueryParams
    });

    const pagination: TablePaginationConfig = {
        total: volunteers?.total ?? 1,
        showTotal: (total) => (
            <>
                <span data-testid="volunteer-count-caption">Волонтеров:</span>{' '}
                <span data-testid="volunteer-count-value">{total}</span>
            </>
        ),
        current: page,
        pageSize: pageSize,
        onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
            localStorage.setItem('volPageIndex', page.toString());
            localStorage.setItem('volPageSize', pageSize.toString());
        }
    };

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

    const openVolunteer = (id: number): Promise<boolean> => {
        edit('volunteers', id);

        return Promise.resolve(true);
    };

    const volunteersData = volunteers?.data ?? [];
    const noActiveFilters = activeFilters.length === 0;

    const showPersons = searchText && noActiveFilters && volunteersData.length === 0;

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
                        {isDesktop && (
                            <>
                                <Row style={{ gap: '24px' }} align="middle">
                                    {/* <b>Сохраненные таблицы:</b>

                                <Select placeholder="Выберите" disabled></Select> */}
                                </Row>
                                <Row style={{ gap: '24px' }} align="middle">
                                    <Col>
                                        <b>Результат:</b> <span data-testid="volunteer-count">{volunteers?.total}</span>{' '}
                                        волонтеров
                                    </Col>
                                    <Row style={{ gap: '12px' }} align="middle">
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
                        )}
                    </Row>

                    {isMobile && (
                        <VolunteerMobileList
                            statusById={statusById}
                            volList={volunteersData}
                            openVolunteer={openVolunteer}
                            isLoading={volunteersIsLoading}
                        />
                    )}
                    {isDesktop && (
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
                                    }}
                                />
                            )}
                        </>
                    )}
                </ActiveColumnsContextProvider>
            </CanAccess>
        </List>
    );
};
