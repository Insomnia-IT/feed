import { useState } from 'react';
import { Create, useForm } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Form } from 'antd';

import type { VolEntity } from 'interfaces';

import { useScreen } from 'shared/providers';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';

const contentStyle = {
    background: 'initial',
    boxShadow: 'initial',
    height: '100%'
};

export const VolCreate = () => {
    const translate = useTranslate();

    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        successNotification: (response) => {
            const data = response?.data as VolEntity | undefined;
            const volunteerId = data?.id;
            const volunteerPath = volunteerId ? `/volunteers/edit/${volunteerId}` : '/volunteers';
            const volunteerUrl = new URL(volunteerPath, window.location.origin).toString();
            const resourceName = translate('volunteers.volunteers');
            const createSuccessText = translate('notifications.createSuccess', { resource: resourceName }).trim();

            return {
                message: translate('notifications.success'),
                description: `${createSuccessText}. Путь: ${volunteerUrl}`,
                type: 'success'
            };
        },
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        },
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');
    const shouldHideFooterActions = !isDesktop && activeKey !== '1';

    return (
        <Create
            headerProps={{
                extra: null
            }}
            saveButtonProps={{
                ...saveButtonProps,
                onClick
            }}
            contentProps={{
                ...(shouldHideFooterActions ? { actions: [] } : {}),
                style: contentStyle
            }}
        >
            <Form {...formProps} scrollToFirstError layout="vertical">
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {renderModal()}
        </Create>
    );
};
