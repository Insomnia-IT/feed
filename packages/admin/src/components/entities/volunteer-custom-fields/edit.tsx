import { FC } from 'react';
import { Form } from 'antd';
import { IResourceComponentsProps, useNavigation } from '@refinedev/core';

import type { VolunteerCustomFieldEntity } from 'interfaces';

import { CreateEdit } from './common';
import { Edit, useForm } from '@refinedev/antd';

export const VolunteerCustomFieldEdit: FC<IResourceComponentsProps> = () => {
    const { goBack } = useNavigation();

    const { formProps, saveButtonProps } = useForm<VolunteerCustomFieldEntity>({
        onMutationSuccess: () => {
            goBack();
        },
        redirect: false
    });

    return (
        <div style={{ padding: '24px' }}>
            <Edit
                saveButtonProps={saveButtonProps}
                canDelete={true}
                footerButtonProps={{
                    style: {
                        float: 'left',
                        marginLeft: '24px'
                    }
                }}
            >
                <Form {...formProps} layout="vertical">
                    <CreateEdit isEdit={true} />
                </Form>
            </Edit>
        </div>
    );
};
