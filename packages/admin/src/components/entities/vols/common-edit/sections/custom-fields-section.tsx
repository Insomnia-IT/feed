import { Form, Input, Checkbox } from 'antd';
import React, { useEffect, useState } from 'react';
import { useOne } from '@refinedev/core';

import { CustomFieldEntity, VolEntity } from 'interfaces';
import { dataProvider } from '../../../../../dataProvider.ts';

import styles from '../../common.module.css';

export const CustomFieldsSection = ({ canBadgeEdit }: { canBadgeEdit: boolean }) => {
    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    useEffect(() => {
        const loadCustomFields = async () => {
            const { data } = await dataProvider.getList<CustomFieldEntity>({
                resource: 'volunteer-custom-fields'
            });

            setCustomFields(data);
        };

        void loadCustomFields();
    }, []);

    const form = Form.useFormInstance();
    const volunteerId = form.getFieldValue('id');

    const { data } = useOne<VolEntity>({
        resource: 'volunteers',
        id: volunteerId
    });

    const customFieldValues = data?.data?.custom_field_values;

    useEffect(() => {
        // Заполняем "фиктивные" поля значениями из апи
        customFieldValues?.forEach(({ custom_field, value }) => {
            form.setFieldValue(['updated_custom_fields', custom_field.toString()], value);
        });
    }, [customFieldValues, form]);

    return (
        <>
            <p className={styles.formSection__title}>Кастомные Поля</p>
            {customFields
                .filter((item) => item.mobile || canBadgeEdit)
                .map(({ id, name, type }) => {
                    // так как нет возможности указывать элемент массива с определенным id, используем "фиктивные" поля
                    return (
                        <Form.Item key={name} label={name} name={['updated_custom_fields', id.toString()]}>
                            <CustomFieldValueHandler type={type} />
                        </Form.Item>
                    );
                })}
        </>
    );
};

const CustomFieldValueHandler: React.FC<{
    id?: string;
    value?: string;
    onChange?: (value: string) => void;
    type: string;
}> = ({ id, value, onChange = () => {}, type }) => {
    if (type === 'boolean') {
        const checked = value === 'true';

        return (
            <Checkbox defaultChecked={false} checked={checked} onChange={(e) => onChange(String(e.target.checked))} />
        );
    }

    return (
        <Input
            id={id}
            value={value}
            onChange={(e): void => {
                onChange(e.target.value);
            }}
        />
    );
};
