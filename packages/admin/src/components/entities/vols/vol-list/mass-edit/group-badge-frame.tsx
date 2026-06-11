import { useMemo, useState } from 'react';
import type { GroupBadgeEntity, VolEntity } from 'interfaces';
import { type HttpError, useList, useNotification } from '@refinedev/core';
import { Button, Form, Select } from 'antd';

import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import type { ChangeMassEditField } from './mass-edit-types';

export const GroupBadgeFrame = ({
    selectedVolunteers,
    doChange
}: {
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}) => {
    const [selectedBadge, setSelectedBadge] = useState<GroupBadgeEntity | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
    const { open = () => {} } = useNotification();

    const closeModal = () => {
        setIsModalOpen(false);
    };
    const openModal = () => {
        setIsModalOpen(true);
    };

    const { result, query } = useList<GroupBadgeEntity, HttpError>({
        resource: 'group-badges',
        pagination: {
            pageSize: 10000
        }
    });

    const badges = result.data ?? [];
    const groupBadgesIsLoading = query.isLoading;

    const mappedBadges = useMemo(
        () =>
            badges.map((item: GroupBadgeEntity) => ({
                value: item.name,
                label: item.name
            })),
        [badges]
    );

    const onBadgeChange = (name: string) => {
        const targetBadge = badges.find((item) => item.name === name);
        setSelectedBadge(targetBadge);
    };

    const confirmChange = () => {
        if (!selectedBadge?.id) {
            open({
                message: 'Некорректный бейдж!',
                description: 'Выбранный бейдж не существует, либо не заполнен id',
                type: 'error',
                undoableTimeout: 5000
            });

            console.error('<GroupBadgeFrame/> error: Выбранный бейдж не существует, либо не заполнен id', {
                selectedBadge,
                selectedVolunteers,
                badges
            });

            return;
        }

        doChange({ fieldName: 'group_badge', fieldValue: String(selectedBadge.id) });
    };

    const getWarningText = () => {
        const someHasGroupBadge = selectedVolunteers.some((vol) => typeof vol.group_badge === 'number');

        return someHasGroupBadge
            ? 'Несколько выбранных волонтеров уже привязаны к другим групповым бейджам. Они перепривяжутся к новому.'
            : undefined;
    };

    const confirmClear = () => {
        setIsClearModalOpen(false);
        doChange({ fieldName: 'group_badge', fieldValue: null });
    };

    const volunteerCount = selectedVolunteers.length;

    return (
        <Form layout="vertical" style={{ width: '100%' }}>
            <Form.Item name="groupBadge" style={{ width: '100%' }} label="Групповой бейдж" rules={[{ required: true }]}>
                <Select
                    value={selectedBadge?.name}
                    style={{ width: '100%' }}
                    placeholder="Выберите бейдж"
                    loading={groupBadgesIsLoading}
                    options={mappedBadges}
                    onChange={onBadgeChange}
                />
            </Form.Item>

            <Button style={{ width: '100%' }} onClick={() => setIsClearModalOpen(true)}>
                Очистить поле
            </Button>

            <Button type="primary" style={{ width: '100%' }} onClick={openModal} disabled={!selectedBadge}>
                Подтвердить
            </Button>

            <ConfirmModal
                isOpen={isClearModalOpen}
                closeModal={() => setIsClearModalOpen(false)}
                title="Очистить поле?"
                description={`${getVolunteerCountText(volunteerCount)} и очищаете поле "Групповой бейдж"!`}
                onConfirm={confirmClear}
            />

            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                title="Привязать к новому групповому бейджу?"
                description={`${getVolunteerCountText(
                    volunteerCount
                )} и привязываете их к групповому бейджу “${selectedBadge?.name}”.`}
                warning={getWarningText()}
                onConfirm={confirmChange}
            />
        </Form>
    );
};
