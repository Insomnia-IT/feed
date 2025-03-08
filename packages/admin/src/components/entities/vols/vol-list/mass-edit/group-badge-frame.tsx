import React, { useState } from 'react';
import { GroupBadgeEntity, VolEntity } from 'interfaces';
import { useList } from '@refinedev/core';
import { Button, Form, Select } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';

export const GroupBadgeFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [selectedBadge, setSelectedBadge] = useState<GroupBadgeEntity | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const closeModal = () => {
        setIsModalOpen(false);
    };
    const openModal = () => {
        setIsModalOpen(true);
    };

    const { data: groupBadges, isLoading: groupBadgesIsLoading } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        pagination: {
            pageSize: 10000
        }
    });

    const badges = groupBadges?.data ?? [];

    const mappedBadges = badges.map((item) => ({
        value: item.name,
        id: item.id
    }));

    const onBadgeChange = (name: string) => {
        const targetBadge = badges.find((item) => item.name === name);

        setSelectedBadge(targetBadge);
    };

    const confirmChange = () => {
        console.log('confirmChange');
    };

    const getWarningText = () => {
        const someHasGroupBadge = selectedVolunteers.some((vol) => typeof vol.group_badge === 'number');

        if (someHasGroupBadge) {
            return 'Несколько выбранных волонтеров уже привязаны к другим групповым бейджам. Они перепривяжутся к новому.';
        }

        return undefined;
    };

    const volunteerCount = selectedVolunteers?.length ?? 0;

    return (
        <Form layout={'vertical'} style={{ width: '100%' }}>
            <Form.Item
                name="groupBadge"
                layout={'vertical'}
                style={{ width: '100%' }}
                label="Групповой бейдж"
                rules={[{ required: true }]}
            >
                <Select
                    value={selectedBadge?.name}
                    style={{ width: '100%' }}
                    placeholder="Выберите бейдж"
                    loading={groupBadgesIsLoading}
                    options={mappedBadges}
                    onChange={onBadgeChange}
                />
            </Form.Item>

            <Button type={'primary'} style={{ width: '100%' }} onClick={openModal} disabled={!selectedBadge}>
                Подтвердить
            </Button>
            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                title={'Привязать к новому групповому бейджу?'}
                description={`${getVolunteerCountText(volunteerCount)} и привязываете их к групповому бейджу “${selectedBadge?.name}”.`}
                warning={getWarningText()}
                onConfirm={confirmChange}
            />
        </Form>
    );
};
