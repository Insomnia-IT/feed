import { Edit, useForm } from '@refinedev/antd';
import { Form } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';

import type { VolEntity } from 'interfaces';

import { CreateEdit } from './common';
import useSaveConfirm from './use-save-confirm';
import { FC } from 'react';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        }
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    return (
        <Edit
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
                <CreateEdit form={form} />
            </Form>
            {renderModal()}
        </Edit>
    );
};
