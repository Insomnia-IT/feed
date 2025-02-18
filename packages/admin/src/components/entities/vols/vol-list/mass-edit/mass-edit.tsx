import styles from './mass-edit.module.css';
import { Button, Form, Select, Typography } from 'antd';
import {
    CoffeeOutlined,
    TeamOutlined,
    IdcardOutlined,
    CalendarOutlined,
    MoreOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import React, { useState } from 'react';
import { useList } from '@refinedev/core';
import { GroupBadgeEntity } from '../../../../../interfaces';
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
    const { data: groupBadges, isLoading: groupBadgesIsLoading } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        pagination: {
            pageSize: 10000
        }
    });

    const mappedBadges = (groupBadges?.data ?? []).map((item) => ({
        value: item.name,
        id: item.id
    }));

    const changeBadgeMany = (formValues: { groupBadge?: string }) => {
        const { groupBadge } = formValues;

        const targetBadge = mappedBadges.find((item) => item.value === groupBadge);
        console.log(targetBadge);
    };

    return (
        <Form onFinish={changeBadgeMany} layout={'vertical'} style={{ width: '100%' }}>
            <Form.Item name="groupBadge" label="Групповой бейдж" rules={[{ required: true }]}>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Выберите бейдж"
                    loading={groupBadgesIsLoading}
                    options={mappedBadges}
                />
            </Form.Item>
            <Button className={styles.bottomButton} htmlType="submit" type={'primary'}>
                Подтвердить
            </Button>
        </Form>
    );
};
