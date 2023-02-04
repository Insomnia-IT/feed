import { Checkbox, Create, Form, Input, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useState } from 'react';

import type { DepartmentEntity } from '~/interfaces';
import { Rules } from '~/components/form/rules';

export const DepartmentCreate: FC<IResourceComponentsProps> = () => {
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
                {/*
                <Form.Item label='Content' name='content'>
                    <ReactMde
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        generateMarkdownPreview={(markdown) =>
                            Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)
                        }
                    />
                </Form.Item>
*/}
                {/*
                <Form.Item label='Is Active' name='isActive' valuePropName='checked'>
                    <Checkbox>Active</Checkbox>
                </Form.Item>
*/}
            </Form>
        </Create>
    );
};
