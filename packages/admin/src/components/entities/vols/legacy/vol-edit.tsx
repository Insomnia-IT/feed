import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Edit, useForm } from '@refinedev/antd';
import { useBreadcrumb, useResourceParams, useTranslate } from '@refinedev/core';
import { Form, Breadcrumb, type FormProps } from 'antd';
import { useLocation, useNavigate } from 'react-router';

import { useScreen } from 'shared/providers';
import { useLocalStorage } from 'shared/hooks';
import type { VolEntity } from 'interfaces';
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

export const VolEditLegacy = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setItem } = useLocalStorage();
    const returnTo =
        typeof location.state === 'object' && location.state && 'returnTo' in location.state
            ? String(location.state.returnTo)
            : '/volunteers';
    const returnPage =
        typeof location.state === 'object' && location.state && 'returnPage' in location.state
            ? Number(location.state.returnPage)
            : null;
    const returnPageSize =
        typeof location.state === 'object' && location.state && 'returnPageSize' in location.state
            ? Number(location.state.returnPageSize)
            : null;

    const navigateBackToList = () => {
        if (Number.isFinite(returnPage) && returnPage && returnPage > 0) {
            setItem('volPageIndex', String(returnPage));
        }

        if (Number.isFinite(returnPageSize) && returnPageSize && returnPageSize > 0) {
            setItem('volPageSize', String(returnPageSize));
        }

        navigate(returnTo);
    };

    const { id } = useResourceParams();
    const translate = useTranslate();
    const volunteerSaveErrorNotification = useMemo(
        () => createVolunteerFormErrorNotification({ translate, action: 'edit', volunteerId: id }),
        [translate, id]
    );

    const { form, formProps, saveButtonProps, mutation } = useForm<VolEntity>({
        redirect: false,
        errorNotification: volunteerSaveErrorNotification,
        onMutationSuccess: async (e) => {
            await onMutationSuccess(e);
            navigateBackToList();
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

    const name = Form.useWatch('name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const isDeleted = Form.useWatch('deleted_at', form);
    const [personBanned, setPersonBanned] = useState(false);
    const handlePersonBannedChange = useCallback((banned: boolean) => {
        setPersonBanned(banned);
    }, []);
    const volunteerName = name || 'Волонтер';
    const { breadcrumbs } = useBreadcrumb();

    const crumbItems = useMemo(() => {
        if (!breadcrumbs?.length) return [];

        return breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return {
                key: item.label,
                title: isLast ? volunteerName : <Link to={item.href || '#'}>{item.label}</Link>
            };
        });
    }, [breadcrumbs, volunteerName]);

    return (
        <Edit
            headerProps={{
                onBack: navigateBackToList,
                extra: null
            }}
            breadcrumb={crumbItems.length > 0 ? <Breadcrumb items={crumbItems} /> : null}
            title={
                <div className={styles.pageTitle}>
                    Информация о волонтере
                    {isBlocked && (
                        <div className={styles.bannedWrap}>
                            <span className={styles.bannedDescr}>Заблокирован</span>
                        </div>
                    )}
                    {personBanned && <VolunteerPersonBlacklistBadge />}
                    {isDeleted && (
                        <div className={styles.bannedWrap}>
                            <span className={styles.bannedDescr}>Удален</span>
                        </div>
                    )}
                </div>
            }
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
        >
            <Form {...restFormProps} scrollToFirstError layout="vertical" onFinishFailed={handleFinishFailed}>
                <VolunteerPersonBannedSync onBannedChange={handlePersonBannedChange} />
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {renderModal()}
        </Edit>
    );
};
