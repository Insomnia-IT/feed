import styles from './mass-edit.module.css';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { type VolEntity } from 'interfaces';
import { SelectedVolunteerList } from './selected-volunteer-list/selected-volunteer-list.tsx';
import { GroupBadgeFrame } from './group-badge-frame';
import { ArrivalsFrame } from './arrivals-frame';
import { KitchenFrame } from './kitchen-frame';
import { InitialFrame } from './initial-frame';
import { ActionSectionStates } from './action-section-states';
import { CustomFieldsFrame } from './custom-fields-frame';

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

const ActionsSection: React.FC<{ unselectAll: () => void; selectedVolunteers: VolEntity[] }> = ({
    unselectAll,
    selectedVolunteers
}) => {
    const [sectionState, setSectionState] = useState<ActionSectionStates>(ActionSectionStates.Initial);

    return (
        <section className={styles.action}>
            {sectionState === ActionSectionStates.Initial ? (
                <InitialFrame selectedVolunteers={selectedVolunteers} setSectionState={setSectionState} />
            ) : null}
            {![ActionSectionStates.Initial, ActionSectionStates.Arrivals].includes(sectionState) ? (
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
            ) : null}
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
                <ArrivalsFrame
                    goBack={() => {
                        setSectionState(ActionSectionStates.Initial);
                    }}
                    selectedVolunteers={selectedVolunteers}
                />
            ) : null}

            <Button className={styles.bottomButton} type={'link'} onClick={unselectAll}>
                Снять выбор
            </Button>
        </section>
    );
};
