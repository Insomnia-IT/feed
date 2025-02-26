import styles from './mass-edit.module.css';
import { Button, DatePicker, Form, Select, Typography } from 'antd';
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    CoffeeOutlined,
    IdcardOutlined,
    MoreOutlined,
    TeamOutlined
} from '@ant-design/icons';
import React, { useState } from 'react';
import { useList, useSelect } from '@refinedev/core';
import { GroupBadgeEntity, KitchenEntity, type StatusEntity, type TransportEntity, type VolEntity } from 'interfaces';
import { ConfirmModal } from './confirm-modal/confirm-modal.tsx';
import { SelectedVolunteerList } from './selected-volunteer-list/selected-volunteer-list.tsx';

const { Title } = Typography;

interface MassEditProps {
    selectedVolunteers: VolEntity[];
    unselectAll: () => void;
}

export const MassEdit: React.FC<MassEditProps> = ({ selectedVolunteers = [], unselectAll }) => {
    if (selectedVolunteers.length === 0) {
        return null;
    }

    return (
        <div className={styles.block}>
            <header>
                <Title level={4}>
                    Множественный выбор
                    <span className={styles.counter}> {selectedVolunteers.length}</span>
                </Title>
            </header>
            <SelectedVolunteerList selectedVolunteers={selectedVolunteers} />
            <ActionsSection unselectAll={unselectAll} selectedVolunteers={selectedVolunteers} />
        </div>
    );
};

enum ActionSectionStates {
    Initial,
    GroupBadge,
    Arrivals,
    Kitchen,
    CustomFields
}

const ActionsSection: React.FC<{ unselectAll: () => void; selectedVolunteers: VolEntity[] }> = ({
    unselectAll,
    selectedVolunteers
}) => {
    const [sectionState, setSectionState] = useState<ActionSectionStates>(ActionSectionStates.Initial);

    return (
        <section className={styles.action}>
            {sectionState === ActionSectionStates.Initial ? (
                <InitialFrame selectedVolunteers={selectedVolunteers} setSectionState={setSectionState} />
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

const InitialFrame: React.FC<{
    setSectionState: (state: ActionSectionStates) => void;
    selectedVolunteers: VolEntity[];
}> = ({ setSectionState, selectedVolunteers }) => {
    return (
        <>
            <header>
                <Title level={5}>Быстрые действия</Title>
            </header>
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
                <BadgeButton selectedVolunteers={selectedVolunteers} />
                <Button onClick={() => setSectionState(ActionSectionStates.CustomFields)}>
                    <MoreOutlined />
                    Кастомные поля
                </Button>
            </div>
        </>
    );
};

const BadgeButton: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState<boolean>(false);

    const getWarningText = () => {
        // TODO: сделать реальную проверку
        if (selectedVolunteers.length % 2 === 1) {
            return 'Часть выбранных волонтеров уже имеет бейдж';
        }
    };

    return (
        <>
            <Button onClick={() => setIsTicketsModalOpen(true)}>
                <IdcardOutlined />
                Выдан бейдж
            </Button>
            <ConfirmModal
                title={'Выдать билеты?'}
                description={`Вы выбрали ${selectedVolunteers.length} волонтеров и выдаете им бейджи. Проверяйте несколько раз, каких волонтеров вы выбираете!`}
                warning={getWarningText()}
                onConfirm={() => {}}
                closeModal={() => setIsTicketsModalOpen(false)}
                isOpen={isTicketsModalOpen}
            />
        </>
    );
};

const KitchenFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
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

const CustomFieldsFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    return <>CustomFieldsFrame {selectedVolunteers.length}</>;
};

const ArrivalsFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { options: statusesOptions } = useSelect<StatusEntity>({ resource: 'statuses', optionLabel: 'name' });

    const { options: transportsOptions } = useSelect<TransportEntity>({ resource: 'transports', optionLabel: 'name' });

    const statusesOptionsNew =
        statusesOptions?.map((item) =>
            ['ARRIVED', 'STARTED', 'JOINED'].includes(item.value as string)
                ? { ...item, label: `✅ ${item.label}` }
                : item
        ) ?? [];

    const confirmChange = () => {
        setIsModalOpen(false);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <Form>
            <Form.Item
                style={{ paddingBottom: '5px' }}
                layout={'vertical'}
                name={'dates'}
                label={'Даты заезда'}
                rules={[{ required: true }]}
            >
                <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item
                style={{ paddingBottom: '5px' }}
                layout={'vertical'}
                name={'status'}
                label={'Статус'}
                rules={[{ required: true }]}
            >
                <Select options={statusesOptionsNew} />
            </Form.Item>
            <Form.Item
                style={{ paddingBottom: '5px' }}
                layout={'vertical'}
                name={'arrived'}
                label={'Как добрался'}
                rules={[{ required: true }]}
            >
                <Select options={transportsOptions} />
            </Form.Item>
            <Form.Item style={{ paddingBottom: '15px' }} layout={'vertical'} name={'departed'} label={'Как уехал'}>
                <Select options={transportsOptions} />
            </Form.Item>
            <Button
                type={'primary'}
                style={{ width: '100%' }}
                onClick={() => {
                    setIsModalOpen(true);
                }}
            >
                Подтвердить
            </Button>
            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                title={'Поменять данные заездов?'}
                description={`${getVolunteerCountText(selectedVolunteers.length)} и меняете данные заездов.`}
                onConfirm={confirmChange}
            />
        </Form>
    );
};

const GroupBadgeFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
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

const getVolunteerCountText = (count: number) => {
    return `Вы выбрали ${count} ${count % 10 === 1 ? 'волонтера' : 'волонтеров'}`;
};
