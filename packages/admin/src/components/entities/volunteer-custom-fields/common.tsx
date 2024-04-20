import { Form, Input, Select } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';

import { Rules } from '~/components/form/rules';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export const CreateEdit: FC<{ isEdit?: boolean }> = ({ isEdit }) => (
    <>
        <Form.Item label='Название' name='name' rules={Rules.required}>
            <Input />
        </Form.Item>
        {isEdit ? (
            <div>
                тип данных изменить нельзя
            </div>
        ) : (
            <Form.Item label='Тип данных' name='type' rules={Rules.required}>
                <Select>
                    <Select.Option value='string'>Строка</Select.Option>
                    <Select.Option value='boolean'>Чекбокс</Select.Option>
                </Select>
            </Form.Item>
        )}
        <Form.Item label='Комментарий' name='comment'>
            <ReactQuill />
        </Form.Item>
    </>
);
