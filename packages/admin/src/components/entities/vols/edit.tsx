import { Edit, Form, useForm } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import type { VolEntity } from '~/interfaces';

import { CreateEdit } from './common';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<VolEntity>();

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />
            </Form>
        </Edit>
    );
};
