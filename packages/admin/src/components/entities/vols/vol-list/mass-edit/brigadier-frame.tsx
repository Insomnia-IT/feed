import { useMemo, useState } from 'react';
import type { CrudFilters, HttpError } from '@refinedev/core';
import { useList, useNotification } from '@refinedev/core';
import { Button, Form, Select } from 'antd';

import type { VolEntity } from 'interfaces';
import { useDebouncedCallback } from 'shared/hooks';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';
import useCanAccess from '../../use-can-access';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import type { ChangeMassEditField } from './mass-edit-types';

export const BrigadierFrame = ({
    selectedVolunteers,
    doChange
}: {
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}) => {
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [brigadierSearch, setBrigadierSearch] = useState('');
    const { open = () => {} } = useNotification();
    const canEditBrigadier = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });
    const debouncedBrigadierSearch = useDebouncedCallback((value: string) => setBrigadierSearch(value));

    const selectedVolunteerIds = useMemo(
        () => new Set(selectedVolunteers.map((volunteer) => volunteer.id)),
        [selectedVolunteers]
    );

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

    const { result, query } = useList<VolEntity, HttpError>({
        resource: 'volunteers',
        filters: supervisorFilters,
        pagination: {
            mode: 'server',
            currentPage: 1,
            pageSize: 50
        },
        queryOptions: {
            enabled: canEditBrigadier
        }
    });

    const supervisors = result.data ?? [];
    const supervisorsLoading = query.isLoading;

    const supervisorOptions = useMemo(() => {
        const options = supervisors
            .filter((volunteer) => !selectedVolunteerIds.has(volunteer.id))
            .map((volunteer) => ({
                value: volunteer.id,
                label: formatVolunteerLabel(volunteer)
            }));

        if (selectedSupervisorId && !options.some((option) => option.value === selectedSupervisorId)) {
            const selectedFromList = supervisors.find((volunteer) => volunteer.id === selectedSupervisorId);
            const selectedFromBatch = selectedVolunteers.find((volunteer) => volunteer.id === selectedSupervisorId);

            if (selectedFromList) {
                options.unshift({
                    value: selectedFromList.id,
                    label: formatVolunteerLabel(selectedFromList)
                });
            } else if (selectedFromBatch) {
                options.unshift({
                    value: selectedFromBatch.id,
                    label: formatVolunteerLabel(selectedFromBatch)
                });
            } else {
                options.unshift({
                    value: selectedSupervisorId,
                    label: `ID ${selectedSupervisorId}`
                });
            }
        }

        return options;
    }, [selectedSupervisorId, selectedVolunteerIds, selectedVolunteers, supervisors]);

    const selectedSupervisorLabel = supervisorOptions.find((option) => option.value === selectedSupervisorId)?.label;

    const confirmChange = () => {
        if (!selectedSupervisorId) {
            open({
                message: 'Некорректный бригадир!',
                description: 'Выбранный бригадир не существует, либо не заполнен id',
                type: 'error',
                undoableTimeout: 5000
            });

            console.error('<BrigadierFrame/> error: Выбранный бригадир не существует, либо не заполнен id', {
                selectedSupervisorId,
                selectedVolunteers,
                supervisors
            });

            return;
        }

        doChange({ fieldName: 'supervisor_id', fieldValue: String(selectedSupervisorId) });
    };

    const getWarningText = () => {
        const someHasSupervisor = selectedVolunteers.some(
            (volunteer) => typeof volunteer.supervisor_id === 'number' || volunteer.supervisor?.id
        );

        return someHasSupervisor
            ? 'Несколько выбранных волонтёров уже привязаны к другим бригадирам. Они перепривяжутся к новому.'
            : undefined;
    };

    const confirmClear = () => {
        setIsClearModalOpen(false);
        doChange({ fieldName: 'supervisor_id', fieldValue: null });
    };

    const volunteerCount = selectedVolunteers.length;

    return (
        <Form layout="vertical" style={{ width: '100%' }}>
            <Form.Item name="supervisor" style={{ width: '100%' }} label="Бригадир" rules={[{ required: true }]}>
                <Select
                    showSearch
                    allowClear
                    value={selectedSupervisorId}
                    style={{ width: '100%' }}
                    placeholder="Найти бригадира"
                    filterOption={false}
                    loading={supervisorsLoading}
                    options={supervisorOptions}
                    disabled={!canEditBrigadier}
                    onSearch={debouncedBrigadierSearch}
                    onChange={(value) => setSelectedSupervisorId(value)}
                />
            </Form.Item>

            <Button style={{ width: '100%' }} onClick={() => setIsClearModalOpen(true)} disabled={!canEditBrigadier}>
                Очистить поле
            </Button>

            <Button
                type="primary"
                style={{ width: '100%' }}
                onClick={() => setIsModalOpen(true)}
                disabled={!canEditBrigadier || !selectedSupervisorId}
            >
                Подтвердить
            </Button>

            <ConfirmModal
                isOpen={isClearModalOpen}
                closeModal={() => setIsClearModalOpen(false)}
                title="Очистить поле?"
                description={`${getVolunteerCountText(volunteerCount)} и очищаете поле "Бригадир"!`}
                onConfirm={confirmClear}
            />

            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                title="Назначить бригадира?"
                description={`${getVolunteerCountText(volunteerCount)} и назначаете им бригадира “${selectedSupervisorLabel ?? ''}”.`}
                warning={getWarningText()}
                onConfirm={confirmChange}
            />
        </Form>
    );
};
