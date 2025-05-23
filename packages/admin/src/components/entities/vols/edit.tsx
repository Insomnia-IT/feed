import { Edit, useForm } from '@refinedev/antd';
import { Form, Breadcrumb, Modal } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';
import { useBreadcrumb } from '@refinedev/core';
import { Link, useNavigate } from 'react-router-dom';
import { FC, useEffect, useState } from 'react';

import type { VolEntity } from 'interfaces';

import { CreateEdit } from './common';
import useSaveConfirm from './use-save-confirm';
import { useNavigationGuard } from './use-navigation-guard';
import styles from './common.module.css';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const navigate = useNavigate();

    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        },
        warnWhenUnsavedChanges: true
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    const name = Form.useWatch('name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const volunteerName = name || 'Волонтер';
    const { breadcrumbs } = useBreadcrumb();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleNavigation = (path: string) => {
        console.log('handleNavigation called with path:', path);
        setIsModalVisible(true);
        setPendingNavigation(path);
    };

    const handleModalOk = () => {
        console.log('Modal OK clicked, navigating to:', pendingNavigation);
        setIsModalVisible(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    };

    const handleModalCancel = () => {
        console.log('Modal Cancel clicked');
        setIsModalVisible(false);
        setPendingNavigation(null);
    };

    useNavigationGuard(handleNavigation);

    const CustomBreadcrumb = () => {
        if (!breadcrumbs) return null;

        return (
            <Breadcrumb>
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <Breadcrumb.Item key={item.label}>
                            {isLast ? volunteerName : (
                                <Link 
                                    to={item.href || '#'} 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Breadcrumb clicked:', item.href);
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

    return (
        <>
            <Edit
                breadcrumb={<CustomBreadcrumb />}
                title={
                    <div className={styles.pageTitle}>
                        Информация о волонтере
                        {isBlocked && (
                            <div className={styles.bannedWrap}>
                                <span className={styles.bannedDescr}>Заблокирован</span>
                            </div>
                        )}
                    </div>
                }
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
                title="Подтверждение перехода"
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="Перейти"
                cancelText="Отмена"
            >
                <p>Вы уверены, что хотите покинуть страницу редактирования волонтера?</p>
            </Modal>
        </>
    );
};
