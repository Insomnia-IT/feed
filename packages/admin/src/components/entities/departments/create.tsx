import { Create, Form, Input, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import type { DepartmentEntity, VolEntity } from '~/interfaces';
import { Rules } from '~/components/form/rules';

export const DepartmentCreate: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<DepartmentEntity>();
    const { selectProps: leadSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <Form.Item label='Name' name='name' rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label='Lead' name='lead'>
                    <Select {...leadSelectProps} />
                </Form.Item>
            </Form>
        </Create>
    );
};
