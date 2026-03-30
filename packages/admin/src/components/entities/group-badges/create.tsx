import { Create, useForm } from '@refinedev/antd';
import { Form } from 'antd';

import type { GroupBadgeEntity } from 'interfaces';

import { CreateEdit } from './common';

export const GroupBadgeCreate = () => {
    const { form, formProps, saveButtonProps } = useForm<GroupBadgeEntity>();

    return (
        <Create
            saveButtonProps={saveButtonProps}
            contentProps={{
                style: {
                    marginBottom: 60,
                    overflow: 'auto'
                }
            }}
        >
            <Form {...formProps} form={form} layout="vertical">
                <CreateEdit />
            </Form>
        </Create>
    );
};
