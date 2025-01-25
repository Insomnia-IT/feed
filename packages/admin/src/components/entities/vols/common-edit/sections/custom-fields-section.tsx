import { Form, Input, Checkbox } from 'antd';

import { CustomFieldEntity } from 'interfaces';

import styles from '../../common.module.css';

export const CustomFieldsSection = ({
    customFields,
    canBadgeEdit
}: {
    customFields: CustomFieldEntity[];
    canBadgeEdit: boolean;
}) => {
    const form = Form.useFormInstance();

    const customFieldValues = form.getFieldValue('custom_field_values');

    return (
        <>
            <p className={styles.formSection__title}>Кастомные Поля</p>
            {customFields
                .filter((item) => item.mobile || canBadgeEdit)
                .map(({ id, name, type }) => {
                    const customFieldValue = customFieldValues?.find(
                        ({ custom_field }: { custom_field: number }) => custom_field === id
                    );
                    const defaultChecked = customFieldValue ? customFieldValue.value === 'true' : false;
                    const defaultValue = customFieldValue ? customFieldValue.value : '';

                    const handleChange = (e: any) => {
                        const value = type === 'boolean' ? e.target.checked : e.target.value;
                        form.setFieldValue(['updated_custom_fields', id.toString()], value);
                    };

                    return (
                        <Form.Item key={name} label={name}>
                            {type === 'boolean' && <Checkbox defaultChecked={defaultChecked} onChange={handleChange} />}
                            {type === 'string' && <Input defaultValue={defaultValue} onChange={handleChange} />}
                        </Form.Item>
                    );
                })}
        </>
    );
};
