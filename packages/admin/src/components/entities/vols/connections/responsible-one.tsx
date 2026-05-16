import { useMemo, useState } from 'react';
import { Button, Form, type FormInstance, Row, Select } from 'antd';
import { type CrudFilters, useList } from '@refinedev/core';
import useCanAccess from '../use-can-access';
import { useDebouncedCallback } from 'shared/hooks';
import type { VolEntity } from 'interfaces';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';
import { EyeOutlined } from '@ant-design/icons';

export const ResponsibleOne = ({ form }: { form: FormInstance }) => {
    const responsibleId = Form.useWatch('responsible_id', form);

    const [responsibleSearch, setResponsibleSearch] = useState('');
    // TODO: replace
    const canEditResponsible = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });
    const debouncedBrigadierSearch = useDebouncedCallback((value: string) => setResponsibleSearch(value));

    const responsibleFilters = useMemo<CrudFilters>(
        () => [
            ...(responsibleSearch
                ? [
                      {
                          field: 'search',
                          operator: 'eq' as const,
                          value: responsibleSearch
                      }
                  ]
                : [])
        ],
        [responsibleSearch]
    );

    const { result: responsibleResult, query: responsibleQuery } = useList<VolEntity>({
        resource: 'volunteers',
        filters: responsibleFilters,
        pagination: {
            mode: 'server',
            currentPage: 1,
            pageSize: 50
        }
    });
    const responsibleData = responsibleResult?.data;
    const responsibleLoading = responsibleQuery.isLoading;

    const responsibleOptions = useMemo(() => {
        const options = responsibleData?.map((volunteer) => ({
            value: volunteer.id,
            label: formatVolunteerLabel(volunteer)
        }));

        if (responsibleId && !options.some((option) => option.value === responsibleId)) {
            options.unshift({
                value: responsibleId,
                label: `ID ${responsibleId}`
            });
        }

        return options;
    }, [responsibleId, responsibleData]);

    return (
        <Row align="bottom" style={{ gap: '4px', display: 'flex' }}>
            <Form.Item
                label="Ответственный за меня"
                name="responsible_id"
                normalize={(value) => value ?? null}
                style={{ display: 'flex' }}
            >
                <Select
                    allowClear
                    showSearch
                    placeholder="Найти отвтетсвенного"
                    filterOption={false}
                    onSearch={debouncedBrigadierSearch}
                    options={responsibleOptions}
                    loading={responsibleLoading}
                    disabled={!canEditResponsible}
                    style={{ flex: '1 1 0' }}
                />
            </Form.Item>

            <Form.Item label="">
                <Button
                    title="Открыть отвтетсвенного"
                    icon={<EyeOutlined />}
                    disabled={!responsibleId}
                    onClick={() => {
                        if (responsibleId) {
                            window.location.href = `${window.location.origin}/volunteers/edit/${responsibleId}`;
                        }
                    }}
                />
            </Form.Item>
        </Row>
    );
};
