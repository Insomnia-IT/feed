import { Create, useForm } from '@refinedev/antd';
import type { IResourceComponentsProps } from '@refinedev/core';
import { Form } from 'antd';

import type { VolEntity } from 'interfaces';

import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';
import { FC } from 'react';

export const VolCreate: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        },
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    return (
        <Create
            saveButtonProps={{
                ...saveButtonProps,
                onClick
            }}
            contentProps={{
                style: {
                    background: 'initial',
                    boxShadow: 'initial',
                    height: '100%'
                }
            }}
        >
            <Form {...formProps} scrollToFirstError layout="vertical">
                <CreateEdit />
            </Form>
            {renderModal()}
        </Create>
    );
};
