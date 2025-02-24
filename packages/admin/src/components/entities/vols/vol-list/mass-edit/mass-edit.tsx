import styles from './mass-edit.module.css';
import { Button, Form, Select, Typography } from 'antd';
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    CoffeeOutlined,
    IdcardOutlined,
    MoreOutlined,
    TeamOutlined
} from '@ant-design/icons';
import React, { useState } from 'react';
import { useList } from '@refinedev/core';
import { GroupBadgeEntity, KitchenEntity } from 'interfaces';
import { ConfirmModal } from './confirm-modal/confirm-modal.tsx';

const { Title } = Typography;

// TODO: заменить на реальный тип
type VolunteerPlaceHolder = any;

interface MassEditProps {
    selectedVolunteers: VolunteerPlaceHolder[];
    isAllSelected: boolean;
    unselectAll: () => void;
}

export const MassEdit: React.FC<MassEditProps> = ({ selectedVolunteers = [], isAllSelected = false, unselectAll }) => {
    if (selectedVolunteers.length === 0 && !isAllSelected) {
        return null;
    }

    return (
        <div className={styles.block}>
            <header>
                <Title level={4}>
                    Множественный выбор
                    <span className={styles.counter}> {isAllSelected ? 'Все' : selectedVolunteers.length}</span>
                </Title>
            </header>
            <section>список волонтеров </section>
            <ActionsSection unselectAll={unselectAll} selectedVolunteers={selectedVolunteers} />
        </div>
    );
};

enum ActionSectionStates {
    Initial,
    GroupBadge,
    Arrivals,
    Kitchen,
    HasTicket,
    CustomFields
}

const ActionsSection: React.FC<{ unselectAll: () => void; selectedVolunteers: VolunteerPlaceHolder[] }> = ({
    unselectAll,
    selectedVolunteers
}) => {
    const [sectionState, setSectionState] = useState<ActionSectionStates>(ActionSectionStates.Initial);

    return (
        <section className={styles.action}>
            {sectionState === ActionSectionStates.Initial ? (
                <>
                    <header>
                        <Title level={5}>Быстрые действия</Title>
                    </header>
                    <InitialFrame setSectionState={setSectionState} />
                </>
            ) : (
                <header>
                    <Button
                        size={'small'}
                        onClick={() => {
                            setSectionState(ActionSectionStates.Initial);
                        }}
                        type={'text'}
                        icon={<ArrowLeftOutlined />}
                    />
                    <Title level={5}>К выбору действий</Title>
                </header>
            )}
            {sectionState === ActionSectionStates.Kitchen ? (
                <KitchenFrame selectedVolunteers={selectedVolunteers} />
            ) : null}
            {sectionState === ActionSectionStates.CustomFields ? (
                <CustomFieldsFrame selectedVolunteers={selectedVolunteers} />
            ) : null}
            {sectionState === ActionSectionStates.HasTicket ? (
                <HasTicketFrame selectedVolunteers={selectedVolunteers} />
            ) : null}
            {sectionState === ActionSectionStates.GroupBadge ? (
                <GroupBadgeFrame selectedVolunteers={selectedVolunteers} />
            ) : null}
            {sectionState === ActionSectionStates.Arrivals ? (
                <ArrivalsFrame selectedVolunteers={selectedVolunteers} />
            ) : null}

            <Button className={styles.bottomButton} type={'link'} onClick={unselectAll}>
                Снять выбор
            </Button>
        </section>
    );
};

const InitialFrame: React.FC<{ setSectionState: (state: ActionSectionStates) => void }> = ({ setSectionState }) => {
    return (
        <>
            <div className={styles.buttons}>
                <Button onClick={() => setSectionState(ActionSectionStates.Arrivals)}>
                    <CalendarOutlined />
                    Заезды
                </Button>
                <Button onClick={() => setSectionState(ActionSectionStates.GroupBadge)}>
                    <TeamOutlined />
                    Групповой бейдж
                </Button>
                <Button
                    onClick={() => {
                        setSectionState(ActionSectionStates.Kitchen);
                    }}
                >
                    <CoffeeOutlined />
                    Кухня
                </Button>
                <Button onClick={() => setSectionState(ActionSectionStates.HasTicket)}>
                    <IdcardOutlined />
                    Билет выдан
                </Button>
                <Button onClick={() => setSectionState(ActionSectionStates.CustomFields)}>
                    <MoreOutlined />
                    Кастомные поля
                </Button>
            </div>
        </>
    );
};

const KitchenFrame: React.FC<{ selectedVolunteers: VolunteerPlaceHolder[] }> = ({ selectedVolunteers }) => {
    const [selectedKitchenName, setSelectedKitchenName] = useState<string | undefined>();

    const { data: kitchensData } = useList<KitchenEntity>({
        resource: 'kitchens',
        pagination: {
            pageSize: 10000
        }
    });

    const kitchens = kitchensData?.data ?? [];

    const closeModal = () => {
        setSelectedKitchenName(undefined);
    };

    const confirmChange = () => {
        const currentKitchen = kitchens.find((kitchen) => kitchen.name === selectedKitchenName);

        console.log('changeKitchen to ', currentKitchen);

        closeModal();
    };

    return (
        <Form layout={'vertical'} style={{ width: '100%' }}>
            <Form.Item
                name="kitchen"
                layout={'vertical'}
                style={{ width: '100%' }}
                label="Выберете кухню"
                rules={[{ required: true }]}
            >
                <div style={{ display: 'flex', columnGap: '8px' }}>
                    {kitchens.map((kitchen) => {
                        return (
                            <Button
                                style={{ width: '50%' }}
                                key={kitchen.name}
                                onClick={() => {
                                    setSelectedKitchenName(kitchen.name);
                                }}
                            >
                                {kitchen.name}
                            </Button>
                        );
                    })}
                </div>
            </Form.Item>
            <ConfirmModal
                title={'Поменять кухню?'}
                description={`${getVolunteerCountText(selectedVolunteers?.length ?? 0)} и привязываете их к ${
                    selectedKitchenName
                }`}
                onConfirm={confirmChange}
                closeModal={closeModal}
                isOpen={!!selectedKitchenName}
            />
        </Form>
    );
};

const CustomFieldsFrame: React.FC<{ selectedVolunteers: VolunteerPlaceHolder[] }> = ({ selectedVolunteers }) => {
    return <>CustomFieldsFrame {selectedVolunteers.length}</>;
};

const HasTicketFrame: React.FC<{ selectedVolunteers: VolunteerPlaceHolder[] }> = ({ selectedVolunteers }) => {
    return <>HasTicketFrame {selectedVolunteers.length}</>;
};

const ArrivalsFrame: React.FC<{ selectedVolunteers: VolunteerPlaceHolder[] }> = ({ selectedVolunteers }) => {
    return <>ArrivalsFrame {selectedVolunteers.length}</>;
};

const GroupBadgeFrame: React.FC<{ selectedVolunteers: VolunteerPlaceHolder[] }> = ({ selectedVolunteers }) => {
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
        return 'Несколько выбранных волонтеров уже привязаны к другим групповым бейджам. Они перепривяжутся к новому.';
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

const getVolunteerCountText = (count: number) => {
    return `Вы выбрали ${count} ${count % 10 === 1 ? 'волонтера' : 'волонтеров'}`;
};
