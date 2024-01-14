import { Form, Input } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';

import { Rules } from '~/components/form/rules';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export const CreateEdit: FC = () => (
    <>
        <Form.Item label='Название' name='name' rules={Rules.required}>
            <Input />
        </Form.Item>
        <Form.Item label='Комментарий' name='comment'>
            <ReactQuill />
        </Form.Item>
    </>
);
