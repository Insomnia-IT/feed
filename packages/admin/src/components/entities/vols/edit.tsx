import { Edit, useForm } from '@refinedev/antd';
import { Form, Breadcrumb, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { IResourceComponentsProps } from '@refinedev/core';
import { useBreadcrumb } from '@refinedev/core';
import { Link, useNavigate } from 'react-router-dom';
import { FC, useState, useEffect } from 'react';

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
        warnWhenUnsavedChanges: false
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);

    const name = Form.useWatch('name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const volunteerName = name || 'Волонтер';
    const { breadcrumbs } = useBreadcrumb();

    useEffect(() => {
        // Добавляем запись в историю при монтировании компонента
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            const isDirty = form.isFieldsTouched();
            if (isDirty) {
                // Показываем модальное окно
                handleNavigation(window.location.pathname);
                // Возвращаем историю в исходное состояние
                window.history.pushState(null, '', window.location.href);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [form]);

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
        onClick();
    };

    useNavigationGuard(handleNavigation, form);

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
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '22px' }} />
                        <span>Вы не сохранили изменения</span>
                    </div>
                }
                open={isModalVisible}
                onOk={handleModalCancel}
                onCancel={handleModalOk}
                okText="Сохранить"
                cancelText="Отменить изменения"
            >
                <p>Если вы выйдете из профиля волонтера, не сохранив изменения, то новые данные исчезнут</p>
            </Modal>
        </>
    );
};
