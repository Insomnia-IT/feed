import { useMemo, useState } from 'react';
import { Button, Form, type FormInstance, Select } from 'antd';
import { type CrudFilters, useList, useOne } from '@refinedev/core';
import useCanAccess from '../use-can-access';
import { useDebouncedCallback } from 'shared/hooks';
import type { VolEntity } from 'interfaces';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';
import { ExportOutlined } from '@ant-design/icons';
import { useScreen } from '../../../../shared/providers';

import connectionsStyles from './connections.module.css';
import { clearVolunteerRelationSelect, handleVolunteerRelationSelectChange } from './connections-select-handlers';

export const ResponsibleOne = ({ form }: { form: FormInstance }) => {
    const responsibleId = Form.useWatch('responsible_id', form);
    const volId = form.getFieldValue('id');
    const { isMobile } = useScreen();

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

    const { result: currentResponsible } = useOne<VolEntity>({
        resource: 'volunteers',
        id: responsibleId,
        queryOptions: {
            enabled: Boolean(responsibleId)
        }
    });

    const responsibleLoading = responsibleQuery.isLoading;

    const responsibleOptions = useMemo(() => {
        const responsibleData = responsibleResult?.data ?? [];

        const options = responsibleData
            .filter((vol) => !vol.infant && vol.id !== volId)
            .map((volunteer) => ({
                value: volunteer.id,
                label: formatVolunteerLabel(volunteer)
            }));

        if (responsibleId && !options.some((option) => option.value === responsibleId)) {
            options.unshift({
                value: responsibleId,
                label: currentResponsible ? formatVolunteerLabel(currentResponsible) : `ID ${responsibleId}`
            });
        }

        return options;
    }, [responsibleResult?.data, responsibleId, volId, currentResponsible]);

    const clearResponsible = () => {
        clearVolunteerRelationSelect({
            form,
            field: 'responsible_id',
            onAfterClear: () => setResponsibleSearch('')
        });
    };

    return (
        <div className={connectionsStyles.fieldRow}>
            <Form.Item
                className={connectionsStyles.fieldGrow}
                label="Ответственный за меня"
                name="responsible_id"
                normalize={(value) => value ?? null}
            >
                <Select
                    id="responsible_id"
                    allowClear
                    showSearch
                    placeholder="Найти ответственного"
                    filterOption={false}
                    onSearch={debouncedBrigadierSearch}
                    onClear={clearResponsible}
                    onChange={(value) =>
                        handleVolunteerRelationSelectChange({
                            form,
                            field: 'responsible_id',
                            value,
                            onAfterClear: () => setResponsibleSearch('')
                        })
                    }
                    options={responsibleOptions}
                    loading={responsibleLoading}
                    disabled={!canEditResponsible}
                />
            </Form.Item>

            <Form.Item className={connectionsStyles.fieldAction} label=" " colon={false}>
                <Button
                    title="Открыть ответственного в новой вкладке"
                    icon={<ExportOutlined />}
                    disabled={!responsibleId}
                    onClick={() => {
                        if (responsibleId) {
                            window.open(
                                `${window.location.origin}/volunteers/edit/${responsibleId}`,
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }
                    }}
                >
                    {!isMobile ? 'Открыть ответственного' : null}
                </Button>
            </Form.Item>
        </div>
    );
};
