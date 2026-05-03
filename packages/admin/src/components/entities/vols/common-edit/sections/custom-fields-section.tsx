import { useMemo } from 'react';
import { Form, Input, Checkbox } from 'antd';
import { useList, useOne } from '@refinedev/core';

import type { CustomFieldEntity, VolEntity } from 'interfaces';
import styles from '../../common.module.css';

interface IProps {
    canBadgeEdit: boolean;
    volunteerId: string;
}

interface ICustomFieldValue {
    value?: string;
    custom_field: number | { id: number };
}

export const CustomFieldsSection = ({ canBadgeEdit, volunteerId }: IProps) => {
    const form = Form.useFormInstance();

    const { result: customFieldsResult } = useList<CustomFieldEntity>({
        resource: 'volunteer-custom-fields',
        pagination: { mode: 'off' }
    });

    const { result: volunteer } = useOne<VolEntity>({
        resource: 'volunteers',
        id: volunteerId
    });

    const customFields = customFieldsResult.data ?? [];
    const customFieldValues = (volunteer as unknown as { custom_field_values?: ICustomFieldValue[] } | undefined)
        ?.custom_field_values;

    const customFieldValuesById = useMemo(() => {
        const map = new Map<number, string | undefined>();

        customFieldValues?.forEach(({ value, custom_field }) => {
            const id = typeof custom_field === 'number' ? custom_field : custom_field.id;
            map.set(id, value);
        });

        return map;
    }, [customFieldValues]);

    return (
        <>
            <p className={styles.formSection__title}>Кастомные Поля</p>

            {customFields
                .filter((item) => item.mobile || canBadgeEdit)
                .map((item) => {
                    const fieldName = ['updated_custom_fields', item.id.toString()];

                    // Для случая стирания поля, чтобы старое значение не "мигало"
                    const isFieldTouched = form.isFieldTouched(fieldName);
                    const valueFromAPI = isFieldTouched ? undefined : customFieldValuesById.get(item.id);

                    // так как нет возможности указывать элемент массива с определенным id, используем "фиктивные" поля
                    return (
                        <Form.Item key={item.id} label={item.name} name={fieldName}>
                            <CustomFieldValueHandler type={item.type} valueFromAPI={valueFromAPI} />
                        </Form.Item>
                    );
                })}
        </>
    );
};

const CustomFieldValueHandler = ({
    id,
    value,
    valueFromAPI,
    onChange = () => {},
    type
}: {
    id?: string;
    value?: string;
    valueFromAPI?: string;
    onChange?: (value: string) => void;
    type: string;
}) => {
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
            onChange={(e) => {
                onChange(e.target.value);
            }}
        />
    );
};
