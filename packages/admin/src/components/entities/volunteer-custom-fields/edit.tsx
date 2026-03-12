import { Form } from 'antd';
import { useNavigation } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';

import type { VolunteerCustomFieldEntity } from 'interfaces';
import { CreateEdit } from './common';

export const VolunteerCustomFieldEdit = () => {
    const { list } = useNavigation();

    const { formProps, saveButtonProps } = useForm<VolunteerCustomFieldEntity>({
        redirect: false,
        onMutationSuccess: () => {
            list('volunteer-custom-fields');
        }
    });

    return (
        <div style={{ padding: '24px' }}>
            <Edit
                saveButtonProps={saveButtonProps}
                canDelete
                footerButtonProps={{
                    style: {
                        float: 'left',
                        marginLeft: '24px'
                    }
                }}
            >
                <Form {...formProps} layout="vertical">
                    <CreateEdit isEdit />
                </Form>
            </Edit>
        </div>
    );
};
