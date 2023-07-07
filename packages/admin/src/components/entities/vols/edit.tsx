import { Edit, Form, useForm } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import type { VolEntity } from '~/interfaces';

import { CreateEdit } from './common';
import useSaveConfirm from './useSaveConfirm';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>();
    const { onClick, renderModal } = useSaveConfirm(form, saveButtonProps);

    return (
        <Edit
            saveButtonProps={{
                ...saveButtonProps,
                onClick
            }}
        >
            <Form {...formProps} layout='vertical'>
                <CreateEdit form={form} />
            </Form>
            {renderModal()}
        </Edit>
    );
};
