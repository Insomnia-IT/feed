import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Edit, useForm } from '@refinedev/antd';
import { useBreadcrumb } from '@refinedev/core';
import { Form, Breadcrumb } from 'antd';
import { useLocation, useNavigate } from 'react-router';

import { useScreen } from 'shared/providers';
import { useLocalStorage } from 'shared/hooks';
import type { VolEntity } from 'interfaces';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';

import styles from './common.module.css';

const contentStyle = {
    background: 'initial',
    boxShadow: 'initial',
    height: '100%'
};

export const VolEdit = () => {
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

    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        redirect: false,
        onMutationSuccess: async (e) => {
            await onMutationSuccess(e);
            navigateBackToList();
        },
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);
    const { isDesktop } = useScreen();

    const [activeKey, setActiveKey] = useState('1');
    const shouldHideFooterActions = !isDesktop && !['1', '2'].includes(activeKey);

    const name = Form.useWatch('name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const isDeleted = Form.useWatch('deleted_at', form);
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
            contentProps={{
                ...(shouldHideFooterActions ? { actions: [] } : {}),
                style: contentStyle
            }}
        >
            <Form {...formProps} scrollToFirstError layout="vertical">
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {renderModal()}
        </Edit>
    );
};
