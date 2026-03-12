import { useState } from 'react';
import { Create, useForm } from '@refinedev/antd';
import { Form } from 'antd';

import type { VolEntity } from 'interfaces';

import { useScreen } from 'shared/providers';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';

export const VolCreate = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        },
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');

    return (
        <Create
            saveButtonProps={{
                ...saveButtonProps,
                onClick,
                hidden: !isDesktop && activeKey !== '1'
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
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {renderModal()}
        </Create>
    );
};
