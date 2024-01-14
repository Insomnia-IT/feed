import {
    Edit,
    Form,
    useForm,
} from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import 'react-mde/lib/styles/css/react-mde-all.css';

import type { VolunteerCustomFieldEntity } from '~/interfaces';

import { CreateEdit } from './common';

export const VolunteerCustomFieldEdit: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<VolunteerCustomFieldEntity>();

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />
            </Form>
        </Edit>
    );
};
