import { useCallback, useMemo, useState } from 'react';
import { Create, useForm } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Form, type FormProps } from 'antd';

import type { VolEntity } from 'interfaces';

import { useScreen } from 'shared/providers';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';
import { createVolunteerFormFinishFailedHandler } from './vol-form-finish-failed';
import { useRegisterVolunteerCardUiBannerForm } from '../volunteer-card-ui-banner-context';
import { VolunteerPersonBannedSync } from '../volunteer-person-banned-sync';
import { VolunteerPersonBlacklistBadge } from '../volunteer-person-blacklist-badge';
import { createVolunteerFormErrorNotification } from '../volunteer-save-feedback';

import styles from './common.module.css';

const contentStyle = {
    background: 'initial',
    boxShadow: 'initial',
    height: '100%'
};

export const VolCreateLegacy = () => {
    const translate = useTranslate();
    const volunteerSaveErrorNotification = useMemo(
        () => createVolunteerFormErrorNotification({ translate, action: 'create' }),
        [translate]
    );

    const { form, formProps, saveButtonProps, mutation } = useForm<VolEntity>({
        errorNotification: volunteerSaveErrorNotification,
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        },
        warnWhenUnsavedChanges: true
    });
    const isSaving = mutation.isPending;
    const isSaveButtonDisabled = Boolean(saveButtonProps.disabled) && !isSaving;
    const volunteerSaveButtonClassName = isSaving ? styles.volunteerSaveButtonSaving : undefined;
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);
    useRegisterVolunteerCardUiBannerForm(form);

    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');

    const { onFinishFailed: upstreamOnFinishFailed, ...restFormProps } = formProps;
    const handleFinishFailed: NonNullable<FormProps['onFinishFailed']> = createVolunteerFormFinishFailedHandler(
        setActiveKey,
        form,
        upstreamOnFinishFailed
    );
    const shouldHideFooterActions = !isDesktop && activeKey !== '1';
    const [personBanned, setPersonBanned] = useState(false);
    const handlePersonBannedChange = useCallback((banned: boolean) => {
        setPersonBanned(banned);
    }, []);

    return (
        <Create
            headerProps={{
                extra: null
            }}
            saveButtonProps={{
                ...saveButtonProps,
                onClick,
                loading: isSaving,
                disabled: isSaveButtonDisabled,
                className: [styles.volunteerSaveButton, volunteerSaveButtonClassName].filter(Boolean).join(' ')
            }}
            contentProps={{
                ...(shouldHideFooterActions ? { actions: [] } : {}),
                style: contentStyle
            }}
            title={
                <div className={styles.pageTitle}>
                    Создание волонтера
                    {personBanned && <VolunteerPersonBlacklistBadge />}
                </div>
            }
        >
            <Form {...restFormProps} scrollToFirstError layout="vertical" onFinishFailed={handleFinishFailed}>
                <VolunteerPersonBannedSync onBannedChange={handlePersonBannedChange} />
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {renderModal()}
        </Create>
    );
};
