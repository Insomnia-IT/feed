import React, { useMemo } from 'react';
import { Form, Input, Checkbox } from 'antd';
import { useList, useOne } from '@refinedev/core';

import { CustomFieldEntity, VolEntity } from 'interfaces';

import styles from '../../common.module.css';

export const CustomFieldsSection = ({ canBadgeEdit, volunteerId }: { canBadgeEdit: boolean; volunteerId: string }) => {
    const form = Form.useFormInstance();

    const { data: customFieldsData } = useList<CustomFieldEntity>({
        resource: 'volunteer-custom-fields',
        pagination: { pageSize: 0 }
    });

    const { data: volunteerData } = useOne<VolEntity>({
        resource: 'volunteers',
        id: volunteerId
    });

    const customFieldValues = volunteerData?.data?.custom_field_values;

    const customFieldValuesById = useMemo(() => {
        const result = new Map();
        customFieldValues?.forEach(({ value, custom_field }) => {
            result.set(custom_field, value);
        });

        return result;
    }, [customFieldValues]);

    return (
        <>
            <p className={styles.formSection__title}>Кастомные Поля</p>
            {customFieldsData?.data
                ?.filter((item) => item.mobile || canBadgeEdit)
                .map(({ id, name, type }) => {
                    const fieldName = ['updated_custom_fields', id.toString()];

                    // Для случая стирания поля, чтобы старое значение не "мигало"
                    const isFieldTouched = form.isFieldTouched(fieldName);

                    const valueFromAPI = isFieldTouched ? undefined : customFieldValuesById.get(id);

                    // так как нет возможности указывать элемент массива с определенным id, используем "фиктивные" поля
                    return (
                        <Form.Item key={name} label={name} name={fieldName}>
                            <CustomFieldValueHandler type={type} valueFromAPI={valueFromAPI} />
                        </Form.Item>
                    );
                })}
        </>
    );
};

const CustomFieldValueHandler: React.FC<{
    id?: string;
    value?: string;
    valueFromAPI?: string;
    onChange?: (value: string) => void;
    type: string;
}> = ({ id, value, valueFromAPI, onChange = () => {}, type }) => {
    const targetValue = value ?? valueFromAPI;

    if (type === 'boolean') {
        const checked = targetValue === 'true';

        return (
            <Checkbox defaultChecked={false} checked={checked} onChange={(e) => onChange(String(e.target.checked))} />
        );
    }

    return (
        <Input
            id={id}
            value={targetValue}
            onChange={(e): void => {
                onChange(e.target.value);
            }}
        />
    );
};
