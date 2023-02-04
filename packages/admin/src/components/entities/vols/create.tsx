import { Create, Form, Input, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import type { VolEntity } from '~/interfaces';

import { CreateEdit } from './common';

export const VolCreate: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<VolEntity>();

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />
            </Form>
        </Create>
    );
};
