import { Checkbox, Form, Input, Select } from 'antd';
import { FC, lazy, Suspense } from 'react';
import { Rules } from 'components/form/rules';

const ReactQuill = lazy(() => import('react-quill'));

export const CreateEdit: FC<{ isEdit?: boolean }> = ({ isEdit }) => (
    <>
        <Form.Item
            label="Название"
            name="name"
            rules={[
                { required: true, message: 'Введите название' },
                { max: 30, message: 'Максимум 30 символов' }
            ]}
        >
            <Input showCount placeholder="Введите название не более 30 символов" />
        </Form.Item>
        <Form.Item label="Тип данных" name="type" rules={Rules.required}>
            <Select disabled={isEdit}>
                <Select.Option value="string">Строка</Select.Option>
                <Select.Option value="boolean">Чекбокс</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item label="Комментарий" name="comment">
            <Suspense fallback={<div>Loading editor...</div>}>
                <ReactQuill />
            </Suspense>
        </Form.Item>
        <Form.Item name="mobile" valuePropName="checked">
            <Checkbox>Показывать в мобильной админке?</Checkbox>
        </Form.Item>
    </>
);
