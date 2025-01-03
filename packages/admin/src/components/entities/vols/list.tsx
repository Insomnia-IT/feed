import type { TablePaginationConfig } from '@pankod/refine-antd';
import { Col, List, Row, Select } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList, useNavigation } from '@pankod/refine-core';
import { FC, useEffect, useState } from 'react';
import { Input } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { CustomFieldEntity, VolEntity } from 'interfaces';
import { dataProvider } from 'dataProvider';
import { useMedia } from 'shared/providers';

import { Filters } from './vol-list/filters';
import { SaveAsXlsxButton } from './vol-list/save-as-xlsx-button';
import { VolunteerDesktopTable } from './vol-list/volunteer-desktop-table';
import { VolunteerMobileList } from './vol-list/volunteer-mobile-list';
import useCanAccess from './use-can-access';

import { ChooseColumnsButton } from './vol-list/choose-columns-button';
import { ActiveColumnsContextProvider } from './vol-list/active-columns-context';
import { useFilters } from 'components/entities/vols/vol-list/use-filters';

export const VolList: FC<IResourceComponentsProps> = () => {
    const [page, setPage] = useState(parseFloat(localStorage.getItem('volPageIndex') || '') || 1);

    const { isDesktop, isMobile } = useMedia();

    const canListCustomFields = useCanAccess({
        action: 'list',
        resource: 'volunteer-custom-fields'
    });

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const [pageSize, setPageSize] = useState(parseFloat(localStorage.getItem('volPageSize') || '') || 10);

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
        config: {
            pagination: {
                current: isMobile ? 1 : page,
                pageSize: isMobile ? 10000 : pageSize
            }
        }
    });

    const pagination: TablePaginationConfig = {
        total: volunteers?.total ?? 1,
        showTotal: (total) => `Кол-во волонтеров: ${total}`,
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

    const volunteersData = volunteers?.data ?? [];

    const queryClient = useQueryClient();
    const { push } = useNavigation();

    const openVolunteer = (id: number): Promise<boolean> => {
        queryClient.clear();
        push(`/volunteers/edit/${id}`);
        return Promise.resolve(true);
    };

    return (
        <List>
            <ActiveColumnsContextProvider customFields={customFields}>
                {/* -------------------------- Фильтры -------------------------- */}
                <Input
                    placeholder="Поиск по волонтерам, датам, службам"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                ></Input>
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

                {/* -------------------------- Список волонтеров -------------------------- */}
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
