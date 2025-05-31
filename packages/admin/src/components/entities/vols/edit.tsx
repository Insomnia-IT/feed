import { Edit, useForm } from '@refinedev/antd';
import { Form, Breadcrumb, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { IResourceComponentsProps } from '@refinedev/core';
import { useBreadcrumb } from '@refinedev/core';
import { Link, useNavigate } from 'react-router-dom';
import { FC, useState, useEffect, useCallback } from 'react';

import type { VolEntity } from 'interfaces';

import { CreateEdit } from './common';
import useSaveConfirm from './use-save-confirm';
import { useNavigationGuard } from './use-navigation-guard';
import styles from './common.module.css';

const DEFAULT_VOLUNTEER_NAME = 'Волонтер';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const navigate = useNavigate();

    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        },
        warnWhenUnsavedChanges: false
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    const name = Form.useWatch('name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const volunteerName = name || DEFAULT_VOLUNTEER_NAME;
    const { breadcrumbs } = useBreadcrumb();

    const handleNavigation = useCallback((path: string) => {
        setIsModalVisible(true);
        setPendingNavigation(path);
    }, []);

    const handleModalCancel = useCallback(() => {
        setIsModalVisible(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    }, [pendingNavigation, navigate]);

    const handleModalOk = useCallback(() => {
        setIsModalVisible(false);
        setPendingNavigation(null);
        onClick();
    }, [onClick]);

    useEffect(() => {
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            const isDirty = form.isFieldsTouched();
            if (isDirty) {
                handleNavigation(window.location.pathname);
                window.history.pushState(null, '', window.location.href);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [form, handleNavigation]);

    useNavigationGuard(handleNavigation, form);

    const CustomBreadcrumb = () => {
        if (!breadcrumbs) return null;

        return (
            <Breadcrumb>
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <Breadcrumb.Item key={item.label}>
                            {isLast ? (
                                volunteerName
                            ) : (
                                <Link
                                    to={item.href || '#'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleNavigation(item.href || '#');
                                    }}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </Breadcrumb.Item>
                    );
                })}
            </Breadcrumb>
        );
    };

    const renderTitle = () => (
        <div className={styles.pageTitle}>
            Информация о волонтере
            {isBlocked && (
                <div className={styles.bannedWrap}>
                    <span className={styles.bannedDescr}>Заблокирован</span>
                </div>
            )}
        </div>
    );

    return (
        <>
            <Edit
                breadcrumb={<CustomBreadcrumb />}
                title={renderTitle()}
                saveButtonProps={{
                    ...saveButtonProps,
                    onClick
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
                    <CreateEdit />
                </Form>
                {renderModal()}
            </Edit>
            <Modal
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="Сохранить"
                cancelText="Отменить изменения"
                closable={false}
            >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '22px', marginTop: '2px' }} />

                    <div>
                        <h3 style={{ marginBottom: '8px' }}>Вы не сохранили изменения</h3>
                        <p>Если вы выйдете из профиля волонтера, не сохранив изменения, то новые данные исчезнут</p>
                    </div>
                </div>
            </Modal>
        </>
    );
};
