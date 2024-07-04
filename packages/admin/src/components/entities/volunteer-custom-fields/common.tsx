import { Form, Input, Select } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';

import { Rules } from '~/components/form/rules';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export const CreateEdit: FC<{ isEdit?: boolean }> = ({ isEdit }) => (
    <>
        <Form.Item
            label='Название'
            name='name'
            rules={[
                { required: true, message: 'Введите название' },
                { max: 30, message: 'Максимум 30 символов' }
            ]}
        >
            <Input showCount placeholder='Введите название не более 30 символов' />
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
);
