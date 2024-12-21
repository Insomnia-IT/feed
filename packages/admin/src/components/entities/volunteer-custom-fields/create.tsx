import { FC } from 'react';
import { Create, Form, useForm } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import type { VolunteerCustomFieldEntity } from 'interfaces';

import { CreateEdit } from './common';

export const VolunteerCustomFieldCreate: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<VolunteerCustomFieldEntity>();

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <CreateEdit />
            </Form>
        </Create>
    );
};
