import { useState } from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { VolEntity } from 'interfaces';
import { SelectedVolunteerList } from './selected-volunteer-list/selected-volunteer-list';
import { GroupBadgeFrame } from './group-badge-frame';
import { ArrivalsFrame } from './arrivals-frame';
import { KitchenFrame } from './kitchen-frame';
import { InitialFrame } from './initial-frame';
import { ActionSectionStates, type ActionSectionState } from './action-section-states';
import { CustomFieldsFrame } from './custom-fields-frame';
import type { ChangeMassEditField, VolunteerField } from './mass-edit-types';
import { useDoChange } from './use-do-change';
import { ArrivalDatesProvider } from './arrival-dates-context/arrival-dates-context';

import styles from './mass-edit.module.css';

const { Title } = Typography;

interface MassEditProps {
    selectedVolunteers: VolEntity[];
    unselectAll: () => void;
    unselectVolunteer: (volunteer: VolEntity) => void;
    reloadVolunteers: () => Promise<void>;
}

export const MassEdit = ({
    selectedVolunteers = [],
    unselectAll,
    unselectVolunteer,
    reloadVolunteers
}: MassEditProps) => {
    const [sectionState, setSectionState] = useState<ActionSectionState>(ActionSectionStates.Initial);
    const doChange = useDoChange({ vols: selectedVolunteers, reloadVolunteers });

    if (selectedVolunteers.length === 0) {
        return null;
    }

    const applyChanges = async (params: VolunteerField) => {
        await doChange(params);

        // После действия возвращаемся на первый шаг
        setSectionState(ActionSectionStates.Initial);
    };

    return (
        <div className={styles.block}>
            <header>
                <Title level={4}>
                    Множественный выбор
                    <span className={styles.counter}> {selectedVolunteers.length}</span>
                </Title>
            </header>
            <ArrivalDatesProvider>
                <SelectedVolunteerList
                    unselectVolunteer={unselectVolunteer}
                    selectedVolunteers={selectedVolunteers}
                    outlineVolunteersWithoutArrival={sectionState === ActionSectionStates.Arrivals}
                />
                <ActionsSection
                    setSectionState={setSectionState}
                    sectionState={sectionState}
                    doChange={applyChanges}
                    unselectAll={unselectAll}
                    selectedVolunteers={selectedVolunteers}
                />
            </ArrivalDatesProvider>
        </div>
    );
};

const ActionsSection = ({
    unselectAll,
    selectedVolunteers,
    doChange,
    sectionState,
    setSectionState
}: {
    unselectAll: () => void;
    selectedVolunteers: VolEntity[];
    doChange: ChangeMassEditField;
    sectionState: ActionSectionState;
    setSectionState: (state: ActionSectionState) => void;
}) => {
    return (
        <section className={styles.action}>
            {sectionState === ActionSectionStates.Initial ? (
                <InitialFrame
                    selectedVolunteers={selectedVolunteers}
                    setSectionState={setSectionState}
                    doChange={doChange}
                />
            ) : null}
            {sectionState !== ActionSectionStates.Initial && sectionState !== ActionSectionStates.Arrivals ? (
                <header>
                    <Button
                        size="small"
                        onClick={() => setSectionState(ActionSectionStates.Initial)}
                        type="text"
                        icon={<ArrowLeftOutlined />}
                    />
                    <Title level={5}>К выбору действий</Title>
                </header>
            ) : null}
            {sectionState === ActionSectionStates.Kitchen ? (
                <KitchenFrame selectedVolunteers={selectedVolunteers} doChange={doChange} />
            ) : null}
            {sectionState === ActionSectionStates.CustomFields ? (
                <CustomFieldsFrame selectedVolunteers={selectedVolunteers} doChange={doChange} />
            ) : null}
            {sectionState === ActionSectionStates.GroupBadge ? (
                <GroupBadgeFrame selectedVolunteers={selectedVolunteers} doChange={doChange} />
            ) : null}
            {sectionState === ActionSectionStates.Arrivals ? (
                <ArrivalsFrame
                    doChange={doChange}
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
