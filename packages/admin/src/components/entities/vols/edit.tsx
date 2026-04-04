import { FC, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, useForm } from '@refinedev/antd';
import { useBreadcrumb, type IResourceComponentsProps } from '@refinedev/core';
import { Form, Breadcrumb } from 'antd';

import { useScreen } from 'shared/providers';
import type { VolEntity } from 'interfaces';
import CreateEdit from './common';
import useSaveConfirm from './use-save-confirm';

import styles from './common.module.css';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => onMutationSuccess(e),
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);
    const { isDesktop } = useScreen();

    const [activeKey, setActiveKey] = useState('1');

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
                onClick,
                hidden: !isDesktop && activeKey !== '1'
            }}
            contentProps={{
                style: { background: 'initial', boxShadow: 'initial', height: '100%' }
            }}
        >
            <Form {...formProps} scrollToFirstError layout="vertical">
                <CreateEdit activeKey={activeKey} setActiveKey={setActiveKey} />
            </Form>
            {renderModal()}
        </Edit>
    );
};
