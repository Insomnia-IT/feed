import { useMemo, useState } from 'react';
import { Button, Form, type FormInstance, Row, Select, Tooltip } from 'antd';
import { type CrudFilters, useList } from '@refinedev/core';
import { EyeOutlined } from '@ant-design/icons';
import useCanAccess from '../use-can-access';
import { useDebouncedCallback } from 'shared/hooks';
import { AppRoles } from '../../../../auth';
import type { VolEntity } from 'interfaces';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';

export const SupervisorField = ({ form }: { form: FormInstance }) => {
    const supervisorId = Form.useWatch('supervisor_id', form);
    const supervisor = Form.useWatch('supervisor', form) as { id: number; name: string } | null;
    const [brigadierSearch, setBrigadierSearch] = useState('');
    const canEditBrigadier = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });
    const debouncedBrigadierSearch = useDebouncedCallback((value: string) => setBrigadierSearch(value));

    const supervisorFilters = useMemo<CrudFilters>(
        () => [
            {
                field: 'access_role',
                operator: 'eq' as const,
                value: AppRoles.DIRECTION_HEAD
            },
            ...(brigadierSearch
                ? [
                      {
                          field: 'search',
                          operator: 'eq' as const,
                          value: brigadierSearch
                      }
                  ]
                : [])
        ],
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
                label: supervisor?.name || `ID ${supervisorId}`
            });
        }

        return options;
    }, [supervisor, supervisorId, supervisorsResult]);

    return (
        <Form.Item label="Бригадир" name="supervisor_id" normalize={(value) => value ?? null}>
            <Row align="middle" gutter={8}>
                <Select
                    allowClear
                    showSearch
                    placeholder="Найти бригадира"
                    filterOption={false}
                    onSearch={debouncedBrigadierSearch}
                    options={supervisorOptions}
                    loading={supervisorsLoading}
                    disabled={!canEditBrigadier}
                    style={{ flex: 1 }}
                />
                <Tooltip title="Открыть бригадира">
                    <Button
                        icon={<EyeOutlined />}
                        disabled={!supervisorId}
                        onClick={() => {
                            if (supervisorId) {
                                window.location.href = `${window.location.origin}/volunteers/edit/${supervisorId}`;
                            }
                        }}
                    />
                </Tooltip>
            </Row>
        </Form.Item>
    );
};
