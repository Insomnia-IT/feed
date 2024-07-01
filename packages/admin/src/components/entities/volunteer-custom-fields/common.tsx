import { Alert, Form, Input, Select } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Rules } from '~/components/form/rules';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export const CreateEdit: FC<{ isEdit?: boolean }> = ({ isEdit }) => {
    const [value, setValue] = useState('');
    const maxLength = 30;

    const handleChange = (e) => {
        setValue(e.target.value);
    };
    return (
        <>
            <Form.Item label='Название' name='name' rules={Rules.required}>
                <Input value={value}
                    status={value.length === maxLength ? 'warning' : ''}
                    onChange={handleChange}
                    showCount
                    maxLength={maxLength} />
                {value.length === maxLength && (
                    <Alert message="Достигнут лимит символов в названии" type="warning" showIcon />
                )}
            </Form.Item>
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
    )
};
