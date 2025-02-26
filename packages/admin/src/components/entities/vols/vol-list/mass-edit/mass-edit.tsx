import styles from './mass-edit.module.css';
import { Button, Checkbox, Form, Input, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { type CustomFieldEntity, type VolEntity } from 'interfaces';
import { SelectedVolunteerList } from './selected-volunteer-list/selected-volunteer-list.tsx';
import { GroupBadgeFrame } from './group-badge-frame.tsx';
import { ArrivalsFrame } from './arrivals-frame.tsx';
import { KitchenFrame } from './kitchen-frame.tsx';
import { InitialFrame } from './initial-frame.tsx';
import { ActionSectionStates } from './action-section-states.ts';
import { useList } from '@refinedev/core';

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

const CustomFieldsFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const { data } = useList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' });

    const fields = data?.data ?? [];

    console.log(selectedVolunteers);

    return (
        <>
            <Form>
                {fields.map(({ name, type }) => {
                    const defaultChecked = false;
                    const defaultValue = '';

                    const handleChange = () => {
                        // const value = type === 'boolean' ? e.target.checked : e.target.value;
                    };

                    return (
                        <Form.Item key={name} label={name}>
                            {type === 'boolean' && <Checkbox defaultChecked={defaultChecked} onChange={handleChange} />}
                            {type === 'string' && <Input defaultValue={defaultValue} onChange={handleChange} />}
                        </Form.Item>
                    );
                })}
            </Form>
        </>
    );
};
