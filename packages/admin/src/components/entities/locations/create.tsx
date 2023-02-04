import { Create, Form, Input, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useState } from 'react';

import type { DepartmentEntity } from '~/interfaces';
import { Rules } from '~/components/form/rules';

export const LocationCreate: FC<IResourceComponentsProps> = () => {
    const [selectedTab, setSelectedTab] = useState<'write' | 'preview'>('write');
    const { formProps, saveButtonProps } = useForm<DepartmentEntity>();

    const { selectProps: leadSelectProps } = useSelect<DepartmentEntity>({
        resource: 'vols',
        optionLabel: 'name'
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <Form.Item label='Name' name='name' rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label='Lead' name={['lead', 'id']} rules={Rules.required}>
                    <Select {...leadSelectProps} />
                </Form.Item>
            </Form>
        </Create>
    );
};
