import { Checkbox, Edit, Form, Input, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import ReactMarkdown from 'react-markdown';
import ReactMde from 'react-mde';
import { useState } from 'react';

import 'react-mde/lib/styles/css/react-mde-all.css';

import { Rules } from '~/components/form/rules';
import type { VolEntity } from '~/interfaces';

export const DepartmentEdit: FC<IResourceComponentsProps> = () => {
    const [selectedTab, setSelectedTab] = useState<'write' | 'preview'>('write');
    const { formProps, saveButtonProps } = useForm<VolEntity>();

    const { selectProps: leadSelectProps } = useSelect<VolEntity>({
        resource: 'vols',
        optionLabel: 'name'
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <Form.Item label='Job Title' name='title' rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label='Lead' name={['lead', 'id']} rules={Rules.required}>
                    <Select {...leadSelectProps} />
                </Form.Item>
                <Form.Item label='Location' name='location'>
                    <Input />
                </Form.Item>
                <Form.Item label='Content' name='content'>
                    <ReactMde
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        generateMarkdownPreview={(markdown) =>
                            Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)
                        }
                    />
                </Form.Item>

                <Form.Item label='Is Active' name='isActive' valuePropName='checked'>
                    <Checkbox>Active</Checkbox>
                </Form.Item>
            </Form>
        </Edit>
    );
};
