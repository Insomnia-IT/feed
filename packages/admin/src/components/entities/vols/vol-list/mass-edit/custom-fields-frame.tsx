import React, { useState } from 'react';
import type { CustomFieldEntity, VolEntity } from 'interfaces';
import { useList } from '@refinedev/core';
import { HAS_BADGE_FIELD_NAME } from 'const';
import { Button, Form } from 'antd';
import styles from './mass-edit.module.css';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import { SingleField } from './single-field.tsx';

export const CustomFieldsFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { data } = useList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' });
    const [currentFieldName, setCurrentFieldName] = useState<string | undefined>(undefined);

    const [fieldsValues, setFieldsValues] = useState<Record<string, string | undefined>>({});

    const setFieldValue = (fieldName: string, fieldValue?: string) => {
        setFieldsValues((prevState) => ({ ...prevState, [fieldName]: fieldValue }));
    };

    const fields = (data?.data ?? []).filter((field) => field.name !== HAS_BADGE_FIELD_NAME);

    const confirmChange = (): void => {
        setIsModalOpen(false);
        console.log(fieldsValues);
    };
    const closeModal = (): void => {
        setIsModalOpen(false);
    };

    const currentField = fields.find((field) => field.name === currentFieldName);

    return (
        <>
            <Form className={styles.customFields}>
                {currentField ? (
                    <SingleField
                        type={currentField.type as 'string' | 'boolean'}
                        name={currentField.name}
                        setter={(value) => setFieldValue(currentField.name, value)}
                        title={currentField.name}
                        selectedVolunteers={selectedVolunteers}
                    />
                ) : (
                    fields.map(({ name }) => {
                        return (
                            <Button
                                style={{ width: '100%' }}
                                onClick={() => {
                                    setCurrentFieldName(name);
                                }}
                            >
                                {name}
                            </Button>
                        );
                    })
                )}
            </Form>
            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                title={'Поменять кастомные поля?'}
                description={`${getVolunteerCountText(selectedVolunteers.length)} и меняете кастомные поля.`}
                onConfirm={confirmChange}
            />
        </>
    );
};
