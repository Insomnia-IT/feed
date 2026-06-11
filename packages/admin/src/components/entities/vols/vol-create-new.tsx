import { useState } from 'react';
import { Create, useForm } from '@refinedev/antd';
import { useList, useTranslate } from '@refinedev/core';
import { SaveOutlined } from '@ant-design/icons';
import { App, Button, Form, type FormProps } from 'antd';
import { useNavigate } from 'react-router';

import type { FeedTypeEntity, VolEntity } from 'interfaces';

import { useScreen } from 'shared/providers';
import { useFormUnsavedChanges, useRegisterUnsavedChangesSave } from 'shared/unsaved-changes';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';
import { createVolunteerFormFinishFailedHandler } from './vol-form-finish-failed';
import { createVolunteerFormOnFinish } from './common-edit/sections/volunteer-feeding-form';
import { useVolunteerFormBaselineReady, VolunteerFormReadinessProvider } from './volunteer-form-readiness';
import { useRegisterVolunteerCardUiBannerForm } from './volunteer-card-ui-banner-context';

import styles from './common.module.css';

const contentStyle = {
    background: 'initial',
    boxShadow: 'initial',
    height: '100%'
};

export const VolCreateNew = () => {
    const { result: feedTypesResult, query: feedTypesQuery } = useList<FeedTypeEntity>({
        resource: 'feed-types',
        pagination: { pageSize: 100 }
    });
    const feedTypes = feedTypesResult.data ?? [];

    return (
        <VolunteerFormReadinessProvider>
            <VolCreateContent feedTypes={feedTypes} feedTypesLoading={feedTypesQuery.isLoading} />
        </VolunteerFormReadinessProvider>
    );
};

const VolCreateContent = ({
    feedTypes,
    feedTypesLoading
}: {
    feedTypes: FeedTypeEntity[];
    feedTypesLoading: boolean;
}) => {
    const translate = useTranslate();
    const { notification } = App.useApp();
    const navigate = useNavigate();
    const { isDesktop, isMobile } = useScreen();
    const [activeKey, setActiveKey] = useState('1');

    const { form, formProps, saveButtonProps, formLoading } = useForm<VolEntity>({
        redirect: 'list',
        successNotification: false,
        onMutationSuccess: async (response) => {
            await onMutationSuccess(response as { data: { id: number } });
            clearWarnWhen();

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
        warnWhenUnsavedChanges: false
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps, { feedTypes });
    const isBaselineReady = useVolunteerFormBaselineReady({
        formLoading,
        feedTypesLoading,
        feedTypesCount: feedTypes.length
    });
    const { wrapOnValuesChange, clearWarnWhen } = useFormUnsavedChanges({
        form,
        formLoading,
        isReady: isBaselineReady
    });
    useRegisterUnsavedChangesSave(onClick);
    useRegisterVolunteerCardUiBannerForm(form);

    const {
        onFinish: upstreamOnFinish,
        onFinishFailed: upstreamOnFinishFailed,
        onValuesChange: upstreamOnValuesChange,
        ...restFormProps
    } = formProps;
    const handleFinish = createVolunteerFormOnFinish({
        form,
        upstream: upstreamOnFinish as ((values: VolEntity) => void | Promise<void>) | undefined,
        feedTypes
    });
    const handleFinishFailed: NonNullable<FormProps['onFinishFailed']> = createVolunteerFormFinishFailedHandler(
        setActiveKey,
        form,
        upstreamOnFinishFailed
    );

    const showFloatingSave = isDesktop || ['1', '2'].includes(activeKey);
    const person = Form.useWatch('person', form);

    return (
        <Create
            wrapperProps={{ className: `${styles.volEditPage} vol-edit-page` }}
            headerProps={{
                extra: null
            }}
            title={
                <div className={styles.pageTitleMain}>
                    <span className={styles.pageTitleText}>Создание волонтера</span>
                    {person?.banned && (
                        <div className={styles.bannedWrap}>
                            <span className={styles.bannedDescr}>Чёрный список</span>
                        </div>
                    )}
                </div>
            }
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
            <Form
                {...restFormProps}
                onFinish={handleFinish as NonNullable<typeof upstreamOnFinish>}
                onValuesChange={wrapOnValuesChange(upstreamOnValuesChange)}
                scrollToFirstError
                layout="vertical"
                onFinishFailed={handleFinishFailed}
            >
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {showFloatingSave && (
                <Button
                    type="primary"
                    icon={<SaveOutlined className={isMobile ? styles.floatingSaveButtonIcon : undefined} />}
                    loading={saveButtonProps.loading}
                    disabled={saveButtonProps.disabled}
                    className={`${styles.floatingSaveButton} ${isMobile ? styles.floatingSaveButtonIconOnly : ''}`}
                    onClick={onClick}
                    aria-label={isMobile ? 'Сохранить' : undefined}
                >
                    {isMobile ? null : 'Сохранить'}
                </Button>
            )}
            {renderModal()}
        </Create>
    );
};
