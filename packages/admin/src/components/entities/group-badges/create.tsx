import { FC } from 'react';
import { Create, useForm } from '@refinedev/antd';
import { Form } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';

import type { GroupBadgeEntity } from 'interfaces';

import { CreateEdit } from './common';

export const GroupBadgeCreate: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<GroupBadgeEntity>();

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
            <Form {...formProps} layout="vertical">
                <CreateEdit />
            </Form>
        </Create>
    );
};
