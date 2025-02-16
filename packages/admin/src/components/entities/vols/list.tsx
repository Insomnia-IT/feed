import { useNavigation, useList } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { Input, Row, Col, Select } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { FC, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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

export const VolList: FC = () => {
    const [page, setPage] = useState<number>(parseFloat(localStorage.getItem('volPageIndex') || '') || 1);
    const [pageSize, setPageSize] = useState<number>(parseFloat(localStorage.getItem('volPageSize') || '') || 10);
    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);
    const { isDesktop, isMobile } = useMedia();

    const canListCustomFields = useCanAccess({
        action: 'list',
        resource: 'volunteer-custom-fields'
    });

    const { push } = useNavigation();
    const queryClient = useQueryClient();

    const {
        accessRoleById,
        activeFilters,
        colorNameById,
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

    const { data: volunteers, isLoading: volunteersIsLoading } = useList<VolEntity>({
        resource: `volunteers/${filterQueryParams}`,

        pagination: {
            current: isMobile ? 1 : page,
            pageSize: isMobile ? 10000 : pageSize
        }
    });

    const pagination: TablePaginationConfig = {
        total: volunteers?.total ?? 1,
        showTotal: (total) => <><span data-testid="volunteer-count-caption">Кол-во волонтеров:</span> <span data-testid="volunteer-count-value">{total}</span></>,
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
    }, []);

    const openVolunteer = (id: number): Promise<boolean> => {
        queryClient.clear();
        push(`/volunteers/edit/${id}`);
        return Promise.resolve(true);
    };

    const volunteersData = volunteers?.data ?? [];

    return (
        <List>
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
                    setPage={setPage}
                />
                <Row style={{ padding: '10px 0' }} justify="space-between">
                    {isDesktop && (
                        <>
                            <Row style={{ gap: '24px' }} align="middle">
                                <b>Сохраненные таблицы:</b>

                                <Select placeholder="Выберите" disabled></Select>
                            </Row>
                            <Row style={{ gap: '24px' }} align="middle">
                                <Col>
                                    <b>Результат:</b> {volunteers?.total} волонтеров
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
                                        colorNameById={colorNameById}
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
                    <VolunteerDesktopTable
                        openVolunteer={openVolunteer}
                        pagination={pagination}
                        statusById={statusById}
                        volunteersIsLoading={volunteersIsLoading}
                        volunteersData={volunteersData}
                        customFields={customFields}
                    />
                )}
            </ActiveColumnsContextProvider>
        </List>
    );
};
