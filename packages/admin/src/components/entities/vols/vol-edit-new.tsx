import { useMemo, useState } from 'react';
import { Edit, useForm } from '@refinedev/antd';
import { useList, useResourceParams } from '@refinedev/core';
import { SaveOutlined } from '@ant-design/icons';
import { Button, Form, type FormProps } from 'antd';
import { useLocation, useNavigate } from 'react-router';

import { useScreen } from 'shared/providers';
import { useLocalStorage } from 'shared/hooks';
import {
    runWithUnsavedChangesGuard,
    useFormUnsavedChanges,
    useRegisterUnsavedChangesSave
} from 'shared/unsaved-changes';
import type { FeedTypeEntity, VolEntity } from 'interfaces';
import CreateEdit from './common';
import { VolunteerHeaderPhoto } from './common-edit/sections/vol-info-section/volunteer-header-photo';
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

export const VolEditNew = () => {
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

    const { result: feedTypesResult, query: feedTypesQuery } = useList<FeedTypeEntity>({
        resource: 'feed-types',
        pagination: { pageSize: 100 }
    });
    const feedTypes = feedTypesResult.data ?? [];

    return (
        <VolunteerFormReadinessProvider>
            <VolEditContent
                feedTypes={feedTypes}
                feedTypesLoading={feedTypesQuery.isLoading}
                navigateBackToList={navigateBackToList}
            />
        </VolunteerFormReadinessProvider>
    );
};

const VolEditContent = ({
    feedTypes,
    feedTypesLoading,
    navigateBackToList
}: {
    feedTypes: FeedTypeEntity[];
    feedTypesLoading: boolean;
    navigateBackToList: () => void;
}) => {
    const { id } = useResourceParams();
    const { breakpoint, isDesktop, isMobile } = useScreen();
    const isNarrowMobile = !breakpoint.sm;
    const [activeKey, setActiveKey] = useState('1');

    const { form, formProps, saveButtonProps, formLoading } = useForm<VolEntity>({
        redirect: false,
        onMutationSuccess: async (e) => {
            await onMutationSuccess(e);
            clearWarnWhen();
            navigateBackToList();
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
        isReady: isBaselineReady,
        resetKey: id
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

    const showHeaderPhoto = isNarrowMobile || activeKey !== '1';
    const showFloatingSave = isDesktop || ['1', '2'].includes(activeKey);

    const name = Form.useWatch('name', form);
    const firstName = Form.useWatch('first_name', form);
    const lastName = Form.useWatch('last_name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const isDeleted = Form.useWatch('deleted_at', form);
    const volunteerName = name || 'Волонтер';

    const pageHeading = useMemo(() => {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        return fullName || volunteerName;
    }, [firstName, lastName, volunteerName]);

    return (
        <Edit
            wrapperProps={{
                className: [
                    styles.volEditPage,
                    'vol-edit-page',
                    !isDesktop ? styles.volEditPageCompactHeader : '',
                    showHeaderPhoto ? styles.volEditPageWithHeaderPhoto : ''
                ]
                    .filter(Boolean)
                    .join(' ')
            }}
            headerProps={{
                onBack: () => runWithUnsavedChangesGuard(navigateBackToList),
                extra: showHeaderPhoto ? <VolunteerHeaderPhoto form={form} /> : null
            }}
            breadcrumb={false}
            title={
                <div className={styles.pageTitleMain}>
                    <span className={styles.pageTitleText}>{pageHeading}</span>
                    {isBlocked && (
                        <div className={styles.bannedWrap}>
                            <span className={styles.bannedDescr}>Заблокирован</span>
                        </div>
                    )}
                    {isDeleted && (
                        <div className={styles.bannedWrap}>
                            <span className={styles.bannedDescr}>Удален</span>
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
                style: contentStyle,
                styles: { body: { paddingTop: 0 } }
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
        </Edit>
    );
};
