import type { VolEntity } from 'interfaces';
import styles from './mass-edit.module.css';
import { Button, Typography } from 'antd';
import { CalendarOutlined, CoffeeOutlined, MoreOutlined, TeamOutlined } from '@ant-design/icons';
import { HasBadgeButton } from './has-badge-button';
import { ActionSectionStates, type ActionSectionState } from './action-section-states';
import type { ChangeMassEditField } from './mass-edit-types';

const { Title } = Typography;

export const InitialFrame = ({
    setSectionState,
    selectedVolunteers,
    doChange
}: {
    setSectionState: (state: ActionSectionState) => void;
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
}) => {
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
                <HasBadgeButton doChange={doChange} selectedVolunteers={selectedVolunteers} />
                <Button onClick={() => setSectionState(ActionSectionStates.CustomFields)}>
                    <MoreOutlined />
                    Кастомные поля
                </Button>
            </div>
        </>
    );
};
