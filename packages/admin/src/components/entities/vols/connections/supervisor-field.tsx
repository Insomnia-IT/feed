import { useMemo, useState } from 'react';
import { Button, Form, type FormInstance, Input, Select } from 'antd';
import { type CrudFilters, useList } from '@refinedev/core';
import { ExportOutlined } from '@ant-design/icons';
import useCanAccess from '../use-can-access';
import { useDebouncedCallback } from 'shared/hooks';
import type { VolEntity } from 'interfaces';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';
import { useScreen } from '../../../../shared/providers';

import connectionsStyles from './connections.module.css';
import { clearVolunteerRelationSelect, handleVolunteerRelationSelectChange } from './connections-select-handlers';

export const SupervisorField = ({ form }: { form: FormInstance }) => {
    const supervisorId = Form.useWatch('supervisor_id', form);
    const supervisor = Form.useWatch('supervisor', form) as { id: number; name: string } | null;
    const { isMobile } = useScreen();
    const [brigadierSearch, setBrigadierSearch] = useState('');
    const canEditBrigadier = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });
    const debouncedBrigadierSearch = useDebouncedCallback((value: string) => setBrigadierSearch(value));

    const supervisorFilters = useMemo<CrudFilters>(
        () =>
            brigadierSearch
                ? [
                      {
                          field: 'search',
                          operator: 'eq' as const,
                          value: brigadierSearch
                      }
                  ]
                : [],
        [brigadierSearch]
    );

    const { result: supervisorsResult, query: supervisorsQuery } = useList<VolEntity>({
        resource: 'volunteers',
        filters: supervisorFilters,
        pagination: {
            mode: 'server',
            currentPage: 1,
            pageSize: 50
        }
    });

    const supervisorsLoading = supervisorsQuery.isLoading;

    const supervisorOptions = useMemo(() => {
        const supervisorsData = supervisorsResult.data ?? [];

        const options = supervisorsData.map((volunteer) => ({
            value: volunteer.id,
            label: formatVolunteerLabel(volunteer)
        }));

        if (supervisorId && !options.some((option) => option.value === supervisorId)) {
            options.unshift({
                value: supervisorId,
                label: supervisor?.name ?? `ID ${supervisorId}`
            });
        }

        return options;
    }, [supervisor, supervisorId, supervisorsResult]);

    const clearSupervisor = () => {
        clearVolunteerRelationSelect({
            form,
            field: 'supervisor_id',
            extraValues: { supervisor: null },
            onAfterClear: () => setBrigadierSearch('')
        });
    };

    return (
        <div className={connectionsStyles.fieldRow}>
            <Form.Item name="supervisor" noStyle>
                <Input type="hidden" />
            </Form.Item>
            <Form.Item
                className={connectionsStyles.fieldGrow}
                label="Бригадир"
                name="supervisor_id"
                normalize={(value) => value ?? null}
            >
                <Select
                    id="supervisor_id"
                    allowClear
                    showSearch
                    placeholder="Найти бригадира"
                    filterOption={false}
                    onSearch={debouncedBrigadierSearch}
                    onClear={clearSupervisor}
                    onChange={(value) =>
                        handleVolunteerRelationSelectChange({
                            form,
                            field: 'supervisor_id',
                            value,
                            extraValuesOnClear: { supervisor: null },
                            onAfterClear: () => setBrigadierSearch('')
                        })
                    }
                    options={supervisorOptions}
                    loading={supervisorsLoading}
                    disabled={!canEditBrigadier}
                />
            </Form.Item>

            <Form.Item className={connectionsStyles.fieldAction} label=" " colon={false}>
                <Button
                    title="Открыть бригадира в новой вкладке"
                    icon={<ExportOutlined />}
                    disabled={!supervisorId}
                    onClick={() => {
                        if (supervisorId) {
                            window.open(
                                `${window.location.origin}/volunteers/edit/${supervisorId}`,
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }
                    }}
                >
                    {!isMobile ? 'Открыть бригадира' : null}
                </Button>
            </Form.Item>
        </div>
    );
};
