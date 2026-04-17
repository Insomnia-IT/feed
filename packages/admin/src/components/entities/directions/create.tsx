import { Create, useForm, useSelect } from '@refinedev/antd';
import { Form, Input, Select } from 'antd';

import type { DirectionEntity, DirectionTypeEntity } from 'interfaces';
import { Rules } from 'components/form/rules';

export const DepartmentCreate = () => {
    const { formProps, saveButtonProps } = useForm<DirectionEntity>();

    const { selectProps: typesSelectProps } = useSelect<DirectionTypeEntity>({
        resource: 'direction-types',
        optionLabel: 'name'
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="Название" name="name" rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label="Тип" name="type" rules={Rules.required}>
                    <Select {...typesSelectProps} />
                </Form.Item>
            </Form>
        </Create>
    );
};
