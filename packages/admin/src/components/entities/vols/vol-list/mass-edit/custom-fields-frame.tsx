import React, { ChangeEvent, useState } from 'react';
import type { CustomFieldEntity, VolEntity } from '../../../../../interfaces';
import { useList } from '@refinedev/core';
import { HAS_BADGE_FIELD_NAME } from '../../../../../const.ts';
import { Button, Checkbox, Form, Input } from 'antd';
import styles from './mass-edit.module.css';
import { CheckboxChangeEvent } from 'antd/es/checkbox/Checkbox';
import { ConfirmModal } from './confirm-modal/confirm-modal.tsx';
import { getVolunteerCountText } from './get-volunteer-count-text.ts';

export const CustomFieldsFrame: React.FC<{ selectedVolunteers: VolEntity[] }> = ({ selectedVolunteers }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { data } = useList<CustomFieldEntity>({ resource: 'volunteer-custom-fields' });

    const [fieldsValues, setFieldsValues] = useState<Record<string, string>>({});

    const setFieldValue = (fieldName: string, fieldValue: string) => {
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

    return (
        <>
            <Form className={styles.customFields}>
                {fields.map(({ name, type }) => {
                    const currentValue = fieldsValues[name] ?? '';

                    const handleChange = (event: ChangeEvent<HTMLInputElement> | CheckboxChangeEvent): void => {
                        const newValue =
                            type === 'boolean' ? String(!!event?.target?.checked) : (event?.target?.value ?? '');
                        setFieldValue(name, newValue);
                    };

                    return (
                        <Form.Item key={name} label={name}>
                            {type === 'boolean' && <Checkbox value={currentValue === 'true'} onChange={handleChange} />}
                            {type === 'string' && <Input value={currentValue} onChange={handleChange} />}
                        </Form.Item>
                    );
                })}
            </Form>
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
                title={'Поменять кастомные поля?'}
                description={`${getVolunteerCountText(selectedVolunteers.length)} и меняете кастомные поля.`}
                onConfirm={confirmChange}
            />
        </>
    );
};
