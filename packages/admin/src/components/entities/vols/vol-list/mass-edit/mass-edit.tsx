import styles from './mass-edit.module.css';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { type VolEntity } from 'interfaces';
import { SelectedVolunteerList } from './selected-volunteer-list/selected-volunteer-list';
import { GroupBadgeFrame } from './group-badge-frame';
import { ArrivalsFrame } from './arrivals-frame';
import { KitchenFrame } from './kitchen-frame';
import { InitialFrame } from './initial-frame';
import { ActionSectionStates } from './action-section-states';
import { CustomFieldsFrame } from './custom-fields-frame';
import { useApiUrl, useNotification } from '@refinedev/core';
import { axios } from '../../../../../authProvider';

const { Title } = Typography;

interface MassEditProps {
    selectedVolunteers: VolEntity[];
    unselectAll: () => void;
    unselectVolunteer: (volunteer: VolEntity) => void;
    reloadVolunteers: () => Promise<void>;
}

const useDoChange = ({
    vols,
    unselectAll,
    reloadVolunteers
}: {
    vols: VolEntity[];
    unselectAll: () => void;
    reloadVolunteers: () => Promise<void>;
}) => {
    const apiUrl = useApiUrl();
    const { open = () => {} } = useNotification();

    return async ({ fieldValue, fieldName }: { fieldName: string; fieldValue: string }) => {
        try {
            await axios.post(apiUrl + '/volunteer-group/', {
                volunteers_ids: vols.map((vol) => vol.id),
                field_list: [
                    {
                        field: fieldName,
                        data: fieldValue
                    }
                ]
            });

            open({
                message: 'Изменения успешно применены',
                description: 'Список волонтеров сейчас обновится',
                type: 'success',
                undoableTimeout: 5000
            });

            unselectAll();

            await reloadVolunteers();
        } catch (error) {
            console.error(error);

            open({
                message: 'Произошла ошибка. Возможно, изменения были не применены',
                type: 'error',
                undoableTimeout: 5000
            });
        }
    };
};

export const MassEdit: React.FC<MassEditProps> = ({
    selectedVolunteers = [],
    unselectAll,
    unselectVolunteer,
    reloadVolunteers
}) => {
    const doChange = useDoChange({ vols: selectedVolunteers, unselectAll, reloadVolunteers });

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
            <SelectedVolunteerList unselectVolunteer={unselectVolunteer} selectedVolunteers={selectedVolunteers} />
            <ActionsSection doChange={doChange} unselectAll={unselectAll} selectedVolunteers={selectedVolunteers} />
        </div>
    );
};

const ActionsSection: React.FC<{
    unselectAll: () => void;
    selectedVolunteers: VolEntity[];
    doChange: (params: { fieldName: string; fieldValue: string }) => Promise<void>;
}> = ({ unselectAll, selectedVolunteers, doChange }) => {
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
                <KitchenFrame selectedVolunteers={selectedVolunteers} doChange={doChange} />
            ) : null}
            {sectionState === ActionSectionStates.CustomFields ? (
                <CustomFieldsFrame selectedVolunteers={selectedVolunteers} />
            ) : null}
            {sectionState === ActionSectionStates.GroupBadge ? (
                <GroupBadgeFrame selectedVolunteers={selectedVolunteers} doChange={doChange} />
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
