import { useCallback, useEffect, useMemo, useState } from 'react';
import { useList, CanAccess, useGetIdentity, useTranslate } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { App, Button, Input, Row, Col, Segmented, Typography } from 'antd';
import { PlusSquareOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import { useNavigate } from 'react-router';

import { dataProvider } from 'dataProvider';
import { useDebouncedCallback, useLocalStorage } from 'shared/hooks';
import { useScreen } from 'shared/providers';
import useCanAccess from './use-can-access';
import type { UserData } from 'auth';
import type { CustomFieldEntity, VolEntity } from 'interfaces';

import { Filters } from './vol-list/filters/filters';
import { isEffectiveFilterValue } from './vol-list/filters/is-effective-filter-value';
import type { FilterItem } from 'components/entities/vols/vol-list/filters/filter-types';
import { useFilters } from 'components/entities/vols/vol-list/filters/use-filters';
import { SaveAsXlsxButton } from './vol-list/save-as-xlsx-button';
import { ChooseColumnsButton } from './vol-list/choose-columns-button';
import { VolunteerDesktopTable } from './vol-list/volunteer-desktop-table/volunteer-desktop-table';
import { VolunteerMobileList } from './vol-list/volunteer-mobile-list/volunteer-mobile-list';
import { ActiveColumnsContextProvider } from './vol-list/active-columns-context';
import { useMassEdit } from './vol-list/mass-edit/use-mass-edit';
import { MassEdit } from './vol-list/mass-edit/mass-edit';
import { PersonsTable } from './vol-list/persons-table';

import styles from './list-page.module.css';

const LS_PAGE_INDEX = 'volPageIndex';
const LS_PAGE_SIZE = 'volPageSize';

const getPositiveNumber = (value: string | null, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const VolunteerSearchInput = ({
    onSearchTextChange,
    searchText
}: {
    onSearchTextChange: (value: string) => void;
    searchText: string;
}) => {
    const [searchState, setSearchState] = useState(() => ({
        syncedSearchText: searchText,
        inputValue: searchText
    }));
    const debouncedSetSearchText = useDebouncedCallback(onSearchTextChange, 250);

    if (searchState.syncedSearchText !== searchText) {
        setSearchState({
            syncedSearchText: searchText,
            inputValue: searchText
        });
    }

    const searchInputValue = searchState.inputValue;

    return (
        <div className={styles.volSearchBlock}>
            <Typography.Text type="secondary">Поиск по волонтёрам</Typography.Text>
            <div
                className={
                    [styles.volSearchWrap, searchInputValue.trim().length > 0 && styles.volActiveControlRing]
                        .filter(Boolean)
                        .join(' ') || undefined
                }
            >
                <Input
                    placeholder="Поиск по волонтерам, датам, службам"
                    value={searchInputValue}
                    onChange={(e) => {
                        const nextValue = e.target.value;
                        setSearchState({
                            syncedSearchText: searchText,
                            inputValue: nextValue
                        });
                        debouncedSetSearchText(nextValue);
                    }}
                    allowClear
                />
            </div>
        </div>
    );
};

const VolunteersListCreateButton = ({ activeFilters }: { activeFilters: FilterItem[] }) => {
    const navigate = useNavigate();
    const translate = useTranslate();
    const canCreateVolunteer = useCanAccess({ action: 'create', resource: 'volunteers' });
    const { modal } = App.useApp();

    if (!canCreateVolunteer) {
        return null;
    }

    return (
        <Button
            type="primary"
            icon={<PlusSquareOutlined />}
            onClick={() => {
                if (activeFilters.some(({ value }) => isEffectiveFilterValue(value))) {
                    modal.warning({
                        title: 'Применены фильтры',
                        content:
                            'Список сейчас может быть неполным: при активных фильтрах волонтёр может не отображаться, хотя он уже есть в базе. Сбросьте фильтры и ещё раз поищите, прежде чем создавать новую запись.'
                    });
                    return;
                }
                void navigate('/volunteers/create');
            }}
        >
            {translate('buttons.create', 'Создать')}
        </Button>
    );
};

const DesktopVolunteersContent = ({
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
}: {
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
}) => {
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
            <Row className={styles.desktopActionsRow} justify="end">
                <Col className={styles.desktopResultCol}>
                    <span>
                        <b>Результат:</b> <span data-testid="volunteer-count">{volunteers?.total}</span> волонтеров
                    </span>
                </Col>

                <Row className={styles.desktopButtonsRow}>
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

export const VolList = () => {
    const { isDesktop, isMobile } = useScreen();
    const navigate = useNavigate();
    const { data: user } = useGetIdentity<UserData>();
    const { getItem, setItem } = useLocalStorage();

    const [page, setPage] = useState<number>(() => {
        return getPositiveNumber(getItem(LS_PAGE_INDEX), 1);
    });

    const [pageSize, setPageSize] = useState<number>(() => {
        return getPositiveNumber(getItem(LS_PAGE_SIZE), 10);
    });

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);
    const [customFieldsLoaded, setCustomFieldsLoaded] = useState(false);
    const [hasMyBrigade, setHasMyBrigade] = useState(false);
    const [brigadeScope, setBrigadeScope] = useState<'my' | 'all'>('all');
    const [mobileTotal, setMobileTotal] = useState(0);

    const syncPaginationState = useCallback(
        ({ nextPage, nextPageSize }: { nextPage: number; nextPageSize: number }) => {
            setItem(LS_PAGE_INDEX, String(nextPage));
            setItem(LS_PAGE_SIZE, String(nextPageSize));
        },
        [setItem]
    );

    const setPageWithStorage = useCallback(
        (value: number): void => {
            setPage(value);
            syncPaginationState({ nextPage: value, nextPageSize: pageSize });
        },
        [pageSize, syncPaginationState]
    );

    const setPageSizeWithStorage = useCallback(
        (value: number): void => {
            setPageSize(value);
            syncPaginationState({ nextPage: page, nextPageSize: value });
        },
        [page, syncPaginationState]
    );

    const canListCustomFields = useCanAccess({
        action: 'list',
        resource: 'volunteer-custom-fields'
    });
    const canBulkEdit = useCanAccess({ action: 'bulk_edit', resource: 'volunteers' });

    const {
        activeFilters,
        filterFields,
        filterQueryParams,
        filterQueryParamsWithoutDefaultDirections,
        isFiltersLoading,
        searchText,
        setActiveFilters,
        setSearchText,
        setVisibleFilters,
        statusById,
        visibleFilters
    } = useFilters({
        setPage: setPageWithStorage,
        customFields,
        customFieldsLoaded
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

    useEffect(() => {
        let cancelled = false;

        dataProvider
            .getList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' })
            .then(({ data }) => {
                if (!cancelled) {
                    setCustomFields(data);
                    setCustomFieldsLoaded(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCustomFields([]);
                    setCustomFieldsLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

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

    const openVolunteer = (id: number) => {
        navigate(`/volunteers/edit/${id}`, {
            state: {
                returnTo: '/volunteers',
                returnPage: page,
                returnPageSize: pageSize
            }
        });
        return Promise.resolve(true);
    };

    return (
        <List canCreate headerButtons={() => <VolunteersListCreateButton activeFilters={activeFilters} />}>
            <CanAccess fallback="У вас нет доступа к этой странице">
                <ActiveColumnsContextProvider customFields={customFields}>
                    <VolunteerSearchInput searchText={searchText} onSearchTextChange={setSearchText} />
                    <Filters
                        activeFilters={activeFilters}
                        setActiveFilters={setActiveFilters}
                        visibleFilters={visibleFilters}
                        setVisibleFilters={setVisibleFilters}
                        filterFields={filterFields}
                        isMobile={isMobile}
                        mobileSummary={!isDesktop ? <span>Найдено: {mobileTotal}</span> : undefined}
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

                    {isDesktop ? (
                        <DesktopVolunteersContent
                            page={page}
                            pageSize={pageSize}
                            setPageWithStorage={setPageWithStorage}
                            setPageSizeWithStorage={setPageSizeWithStorage}
                            effectiveFilterQueryParams={effectiveFilterQueryParams}
                            statusById={statusById}
                            customFields={customFields}
                            canBulkEdit={canBulkEdit}
                            canListCustomFields={canListCustomFields}
                            isFiltersLoading={isFiltersLoading}
                            searchText={searchText}
                            activeFilters={activeFilters}
                            openVolunteer={openVolunteer}
                        />
                    ) : (
                        <VolunteerMobileList
                            filterQueryParams={effectiveFilterQueryParams}
                            statusById={statusById}
                            openVolunteer={openVolunteer}
                            onTotalChange={setMobileTotal}
                        />
                    )}
                </ActiveColumnsContextProvider>
            </CanAccess>
        </List>
    );
};
