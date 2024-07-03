import type { FormInstance } from '@pankod/refine-antd';
import { Alert, Form, Input, Select } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Rules } from '~/components/form/rules';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
interface CreateEditProps {
    isEdit?: boolean;
    form?: FormInstance<any>;
}

export const CreateEdit: FC<CreateEditProps> = ({ form, isEdit }) => {
    const [value, setValue] = useState('');
    const maxLength = 30;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue(value);
        form?.setFieldsValue({ name: value });
    };
    return (
        <>
            <Form.Item label='Название' name='name' rules={Rules.required}>
                <Input
                    status={value.length === maxLength ? 'warning' : ''}
                    onChange={handleChange}
                    showCount
                    maxLength={maxLength}
                />
            </Form.Item>
            {value.length === maxLength && (
                <Alert
                    style={{ marginTop: '-20px' }}
                    message='Достигнут лимит символов в названии'
                    type='warning'
                    showIcon
                />
            )}
            <Form.Item label='Тип данных' name='type' rules={Rules.required}>
                <Select disabled={isEdit}>
                    <Select.Option value='string'>Строка</Select.Option>
                    <Select.Option value='boolean'>Чекбокс</Select.Option>
                </Select>
            </Form.Item>
            <Form.Item label='Комментарий' name='comment'>
                <ReactQuill />
            </Form.Item>
        </>
    );
};
