import { useState } from 'react';
import { Create, useForm } from '@refinedev/antd';
import { useList, useTranslate } from '@refinedev/core';
import { SaveOutlined } from '@ant-design/icons';
import { App, Button, Form, type FormProps } from 'antd';
import { useNavigate } from 'react-router';

import type { FeedTypeEntity, VolEntity } from 'interfaces';

import { useScreen } from 'shared/providers';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';
import { createVolunteerFormFinishFailedHandler } from './vol-form-finish-failed';
import { createVolunteerFormOnFinish } from './common-edit/sections/volunteer-feeding-form';

import styles from './common.module.css';

const contentStyle = {
    background: 'initial',
    boxShadow: 'initial',
    height: '100%'
};

export const VolCreate = () => {
    const translate = useTranslate();
    const { notification } = App.useApp();
    const navigate = useNavigate();

    const { result: feedTypesResult } = useList<FeedTypeEntity>({
        resource: 'feed-types',
        pagination: { pageSize: 100 }
    });
    const feedTypes = feedTypesResult.data ?? [];

    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        redirect: 'list',
        successNotification: false,
        onMutationSuccess: async (response) => {
            await onMutationSuccess(response as { data: { id: number } });

            const volunteerId = response?.data?.id;
            const volunteerPath = volunteerId ? `/volunteers/edit/${volunteerId}` : '/volunteers';
            const volunteerUrl = new URL(volunteerPath, window.location.origin).toString();
            const resourceName = translate('volunteers.volunteers', translate('volunteers.label'));
            const createSuccessText = translate('notifications.createSuccess', { resource: resourceName }).trim();

            notification.success({
                message: translate('notifications.success'),
                description: (
                    <>
                        {createSuccessText}.<br /> Путь: <a href={volunteerPath}>{volunteerUrl}</a>
                    </>
                )
            });

            navigate('/volunteers');
        },
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps, { feedTypes });

    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');

    const { onFinish: upstreamOnFinish, onFinishFailed: upstreamOnFinishFailed, ...restFormProps } = formProps;
    const handleFinish = createVolunteerFormOnFinish({ upstream: upstreamOnFinish, feedTypes });
    const handleFinishFailed: NonNullable<FormProps['onFinishFailed']> = createVolunteerFormFinishFailedHandler(
        setActiveKey,
        form,
        upstreamOnFinishFailed
    );

    const showFloatingSave = isDesktop || ['1', '2'].includes(activeKey);

    return (
        <Create
            wrapperProps={{ className: `${styles.volEditPage} vol-edit-page` }}
            headerProps={{
                extra: null
            }}
            saveButtonProps={{
                ...saveButtonProps,
                onClick
            }}
            footerButtons={<> </>}
            contentProps={{
                actions: [],
                style: contentStyle
            }}
        >
            <Form<VolEntity>
                {...restFormProps}
                onFinish={handleFinish}
                scrollToFirstError
                layout="vertical"
                onFinishFailed={handleFinishFailed}
            >
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {showFloatingSave && (
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saveButtonProps.loading}
                    disabled={saveButtonProps.disabled}
                    className={styles.floatingSaveButton}
                    onClick={onClick}
                >
                    Сохранить
                </Button>
            )}
            {renderModal()}
        </Create>
    );
};
