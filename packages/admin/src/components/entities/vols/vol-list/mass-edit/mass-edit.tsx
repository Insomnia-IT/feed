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
import { GroupBadgeEntity } from '../../../../../interfaces';
import { ConfirmModal } from './confirm-modal/confirm-modal.tsx';

const { Title } = Typography;

interface MassEditProps {
    selectedVolunteers: any[];
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
            <ActionsSection unselectAll={unselectAll} />
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

const ActionsSection: React.FC<{ unselectAll: () => void }> = ({ unselectAll }) => {
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
            {sectionState === ActionSectionStates.Kitchen ? <KitchenFrame /> : null}
            {sectionState === ActionSectionStates.CustomFields ? <CustomFieldsFrame /> : null}
            {sectionState === ActionSectionStates.HasTicket ? <HasTicketFrame /> : null}
            {sectionState === ActionSectionStates.GroupBadge ? <GroupBadgeFrame /> : null}
            {sectionState === ActionSectionStates.Arrivals ? <ArrivalsFrame /> : null}

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

const KitchenFrame: React.FC = () => {
    return <>KitchenFrame</>;
};

const CustomFieldsFrame: React.FC = () => {
    return <>CustomFieldsFrame</>;
};

const HasTicketFrame: React.FC = () => {
    return <>HasTicketFrame</>;
};

const ArrivalsFrame: React.FC = () => {
    return <>ArrivalsFrame</>;
};

const GroupBadgeFrame: React.FC = () => {
    const [selectedBadge, setSelectedBadge] = useState<GroupBadgeEntity | undefined>(undefined);
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

    return (
        <Form layout={'vertical'} style={{ width: '100%' }}>
            <Form.Item name="groupBadge" label="Групповой бейдж" rules={[{ required: true }]}>
                <Select
                    value={selectedBadge?.name}
                    style={{ width: '100%' }}
                    placeholder="Выберите бейдж"
                    loading={groupBadgesIsLoading}
                    options={mappedBadges}
                    onChange={onBadgeChange}
                />
            </Form.Item>

            <ConfirmModal
                disabled={!selectedBadge}
                title={'Привязать к новому групповому бейджу?'}
                description={`Вы выбрали 5 волонтеров и привязываете их к групповому бейджу “${selectedBadge?.name}”.`}
                warning={
                    'Несколько выбранных волонтеров уже привязаны к другим групповым бейджам. Они перепривяжутся к новому.'
                }
                onConfirm={() => {}}
            />
        </Form>
    );
};
