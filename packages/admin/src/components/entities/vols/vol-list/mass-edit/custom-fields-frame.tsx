import React, { useState } from 'react';
import type { CustomFieldEntity, VolEntity } from 'interfaces';
import { useList, useNotification } from '@refinedev/core';
import { HAS_BADGE_FIELD_NAME } from 'const';
import { Button, Form } from 'antd';
import styles from './mass-edit.module.css';
import { SingleField } from './single-field';
import { ChangeMassEditField } from './mass-edit-types';

export const CustomFieldsFrame: React.FC<{ selectedVolunteers: VolEntity[]; doChange: ChangeMassEditField }> = ({
    selectedVolunteers,
    doChange
}) => {
    const { data } = useList<CustomFieldEntity>({ resource: 'volunteer-custom-fields', pagination: { pageSize: 0 } });
    const [currentFieldName, setCurrentFieldName] = useState<string | undefined>(undefined);
    const { open = () => {} } = useNotification();

    const setFieldValue = ({ id, fieldValue }: { id: number; fieldValue: string | null }) => {
        if (!id) {
            open({
                message: 'Ошибка заполнения поля. Не найден id кастомного поля.',
                type: 'error',
                undoableTimeout: 5000
            });

            console.error('<CustomFieldsFrame/> error: Ошибка заполнения поля. Не найден id кастомного поля.', {
                selectedVolunteers,
                data,
                id,
                fieldValue,
                currentFieldName
            });

            return;
        }

        doChange({ fieldName: String(id), fieldValue, isCustom: true });
    };

    const fields = (data?.data ?? []).filter((field) => field.name !== HAS_BADGE_FIELD_NAME);

    const currentField = fields.find((field) => field.name === currentFieldName);

    return (
        <Form className={styles.customFields}>
            {currentField ? (
                <SingleField
                    type={currentField.type as 'string' | 'boolean'}
                    setter={(value) => setFieldValue({ id: currentField?.id, fieldValue: value })}
                    title={currentField.name}
                    selectedVolunteers={selectedVolunteers}
                />
            ) : (
                fields.map(({ name }, index) => {
                    return (
                        <Button
                            key={String(name) + String(index)}
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
    );
};
