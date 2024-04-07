import { Edit, Form, Input, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import 'react-mde/lib/styles/css/react-mde-all.css';

import { Rules } from '~/components/form/rules';
import type { DepartmentEntity, VolEntity } from '~/interfaces';

export const DepartmentEdit: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<DepartmentEntity>();
    const { selectProps: leadSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <Form.Item label='Название' name='name' rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label='Руководитель' name='lead'>
                    <Select {...leadSelectProps} />
                </Form.Item>
            </Form>
        </Edit>
    );
};
