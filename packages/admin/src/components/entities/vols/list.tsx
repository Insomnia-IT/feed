import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useList, CanAccess, useGetIdentity } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { Input, Row, Col, Segmented } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';

import { dataProvider } from 'dataProvider';
import { useScreen } from 'shared/providers';
import useCanAccess from './use-can-access';
import type { UserData } from 'auth';

import type { CustomFieldEntity, VolEntity } from 'interfaces';

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

const LS_PAGE_INDEX = 'volPageIndex';
const LS_PAGE_SIZE = 'volPageSize';

const isBrowser = () => typeof window !== 'undefined';

export const VolList = () => {
    const { isDesktop } = useScreen();
    const { edit } = useNavigation();
    const { data: user } = useGetIdentity<UserData>();

    const [page, setPage] = useState<number>(() => {
        if (!isBrowser()) return 1;
        return Number(localStorage.getItem(LS_PAGE_INDEX)) || 1;
    });

    const [pageSize, setPageSize] = useState<number>(() => {
        if (!isBrowser()) return 10;
        return Number(localStorage.getItem(LS_PAGE_SIZE)) || 10;
    });

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);
    const [hasMyBrigade, setHasMyBrigade] = useState(false);
    const [brigadeScope, setBrigadeScope] = useState<'my' | 'all'>('all');

    const setPageWithStorage = useCallback((value: number): void => {
        setPage(value);
        if (!isBrowser()) return;
        localStorage.setItem(LS_PAGE_INDEX, String(value));
    }, []);

    const setPageSizeWithStorage = useCallback((value: number): void => {
        setPageSize(value);
        if (!isBrowser()) return;
        localStorage.setItem(LS_PAGE_SIZE, String(value));
    }, []);

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
        filterQueryParamsWithoutDefaultDirections,
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
        setPage: setPageWithStorage,
        customFields
    });

    const userId = user?.id;

    useEffect(() => {
        if (isDesktop || !userId) return;

        let alive = true;

        void dataProvider
            .getList<VolEntity>({
                resource: `volunteers/?supervisor_id=${userId}`,
                pagination: { currentPage: 1, pageSize: 1 }
            })
            .then(({ total }) => {
                if (!alive) return;

                const hasBrigade = total > 0;
                setHasMyBrigade(hasBrigade);
                setBrigadeScope(hasBrigade ? 'my' : 'all');
            })
            .catch(() => {
                if (!alive) return;

                setHasMyBrigade(false);
                setBrigadeScope('all');
            });

        return () => {
            alive = false;
        };
    }, [isDesktop, userId]);

    const isMyBrigadeAvailable = !isDesktop && Boolean(userId) && hasMyBrigade;
    const effectiveBrigadeScope: 'my' | 'all' = isMyBrigadeAvailable ? brigadeScope : 'all';

    const mobileFilterQueryParams = useMemo(() => {
        if (!isMyBrigadeAvailable || effectiveBrigadeScope !== 'my' || !userId) {
            return filterQueryParams;
        }

        const baseParams = filterQueryParamsWithoutDefaultDirections;
        const separator = baseParams ? '&' : '?';

        return `${baseParams}${separator}supervisor_id=${encodeURIComponent(String(userId))}`;
    }, [
        effectiveBrigadeScope,
        filterQueryParams,
        filterQueryParamsWithoutDefaultDirections,
        isMyBrigadeAvailable,
        userId
    ]);

    const effectiveFilterQueryParams = isDesktop ? filterQueryParams : mobileFilterQueryParams;

    const { result: volunteersResult, query: volunteersQuery } = useList<VolEntity>({
        resource: `volunteers/${effectiveFilterQueryParams}`,
        pagination: isDesktop
            ? {
                  mode: 'server',
                  currentPage: page,
                  pageSize
              }
            : undefined
    });
    const volunteers = volunteersResult;
    const volunteersIsLoading = volunteersQuery.isLoading;
    const reloadVolunteers = volunteersQuery.refetch;

    useEffect(() => {
        // Если текущая страница выходит за пределы общего количества, сбрасываем на 1
        const total = volunteers?.total;
        if (!total) return;

        const outOfRange = (page - 1) * pageSize >= total;
        if (!outOfRange) return;

        // Через setTimeout(0), чтобы не спорить с обновлениями стейта/запроса в том же тике
        const id = setTimeout(() => setPageWithStorage(1), 0);

        return () => {
            clearTimeout(id);
        };
    }, [volunteers?.total, page, pageSize, setPageWithStorage]);

    useEffect(() => {
        if (!canListCustomFields) return;

        let cancelled = false;

        dataProvider.getList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' }).then(({ data }) => {
            if (!cancelled) setCustomFields(data);
        });

        return () => {
            cancelled = true;
        };
    }, [canListCustomFields]);

    const { selectedVols, unselectAllSelected, unselectVolunteer, rowSelection, reloadSelectedVolunteers } =
        useMassEdit({
            totalVolunteersCount: volunteers?.total ?? 0,
            filterQueryParams: effectiveFilterQueryParams
        });

    const pagination = useMemo<TablePaginationConfig>(
        () => ({
            total: volunteers?.total ?? 1,
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

    const openVolunteer = (id: number) => {
        edit('volunteers', id);
        return Promise.resolve(true);
    };

    const noActiveFilters = activeFilters.length === 0;
    const volunteersData = volunteers?.data ?? [];
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
                    {isMyBrigadeAvailable && (
                        <Segmented
                            block
                            options={[
                                { label: 'Моя бригада', value: 'my' },
                                { label: 'Все', value: 'all' }
                            ]}
                            value={effectiveBrigadeScope}
                            onChange={(value) => setBrigadeScope(value as 'my' | 'all')}
                        />
                    )}
                    <Row style={{ padding: '10px 0', gap: '24px' }} justify="end">
                        {isDesktop ? (
                            <>
                                <Col style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>
                                        <b>Результат:</b> <span data-testid="volunteer-count">{volunteers?.total}</span>{' '}
                                        волонтеров
                                    </span>
                                </Col>

                                <Row style={{ gap: '12px' }}>
                                    <ChooseColumnsButton canListCustomFields={canListCustomFields} />
                                    <SaveAsXlsxButton
                                        isDisabled={!volunteersData.length || isFiltersLoading}
                                        filterQueryParams={effectiveFilterQueryParams}
                                        customFields={customFields}
                                        volunteerRoleById={volunteerRoleById}
                                        statusById={statusById}
                                        transportById={transportById}
                                        kitchenNameById={kitchenNameById}
                                        feedTypeNameById={feedTypeNameById}
                                        accessRoleById={accessRoleById}
                                    />
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
                            filterQueryParams={effectiveFilterQueryParams}
                            statusById={statusById}
                            openVolunteer={openVolunteer}
                        />
                    )}
                </ActiveColumnsContextProvider>
            </CanAccess>
        </List>
    );
};
