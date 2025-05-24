import { Checkbox, DatePicker, Form, Input, Select } from 'antd';
import { Create, useForm, useSelect } from '@refinedev/antd';
import type { IResourceComponentsProps } from '@refinedev/core';
import { useEffect, useCallback, FC } from 'react';
import { ulid } from 'ulid';

import type { FeedTransactionEntity, KitchenEntity, VolEntity } from 'interfaces';
import { Rules } from 'components/form/rules';
import type { Dayjs } from 'dayjs';

const mealTimeOptions = [
    { value: 'breakfast', label: 'Завтрак' },
    { value: 'lunch', label: 'Обед' },
    { value: 'dinner', label: 'Ужин' },
    { value: 'night', label: 'Дожор' }
];

export const FeedTransactionCreate: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<FeedTransactionEntity>();
    const { selectProps: volSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });
    const { selectProps: kitchenSelectProps } = useSelect<KitchenEntity>({
        resource: 'kitchens',
        optionLabel: 'name'
    });

    useEffect(() => {
        form.setFieldsValue({ amount: 1, is_vegan: false });
    }, []);

    const onTimeChange = useCallback(
        (value: Dayjs | null) => form.setFieldValue('ulid', value ? ulid(value.unix()) : undefined),
        [form]
    );

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="id" name="ulid" hidden>
                    <Input />
                </Form.Item>
                <Form.Item label="Время" name="dtime" rules={Rules.required}>
                    <DatePicker showTime style={{ width: '100%' }} onChange={onTimeChange} />
                </Form.Item>
                <Form.Item label="Прием пищи" name="meal_time" rules={Rules.required}>
                    <Select options={mealTimeOptions} />
                </Form.Item>
                <Form.Item label="Волонтер" name="volunteer">
                    <Select {...volSelectProps} />
                </Form.Item>
                <Form.Item label="Веган" name="is_vegan" valuePropName="checked">
                    <Checkbox />
                </Form.Item>
                <Form.Item label="Кол-во" name="amount" rules={Rules.required}>
                    <Input type="number" />
                </Form.Item>
                <Form.Item label="Кухня" name="kitchen" rules={Rules.required}>
                    <Select {...kitchenSelectProps} />
                </Form.Item>
            </Form>
        </Create>
    );
};
