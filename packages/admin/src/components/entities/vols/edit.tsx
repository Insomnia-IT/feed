import { Edit, useForm } from '@refinedev/antd';
import { Form, Breadcrumb } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';
import { useBreadcrumb } from '@refinedev/core';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

import type { VolEntity } from 'interfaces';

import { CreateEdit } from './common';
import useSaveConfirm from './use-save-confirm';
import { FC } from 'react';
import styles from './common.module.css';

export const VolEdit: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>({
        onMutationSuccess: (e) => {
            void onMutationSuccess(e);
        }
    });
    const { onClick, onMutationSuccess, renderModal } = useSaveConfirm(form, saveButtonProps);
    const [isDirty, setIsDirty] = useState(false);
    const isFirstRender = useRef(true);

    const name = Form.useWatch('name', form);
    const isBlocked = Form.useWatch('is_blocked', form);
    const volunteerName = name || 'Волонтер';
    const { breadcrumbs } = useBreadcrumb();

    // Отслеживаем изменения формы
    const formValues = Form.useWatch([], form);
    
    useEffect(() => {
        const isFormDirty = form.isFieldsTouched();
        setIsDirty(isFormDirty);
    }, [form, formValues]);

    useEffect(() => {
        return () => {
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }
            
            if (isDirty) {
                alert('У вас есть несохранённые изменения. Пожалуйста, сохраните их перед уходом.');
            }
        };
    }, [isDirty]);

    const CustomBreadcrumb = () => {
        if (!breadcrumbs) return null;

        return (
            <Breadcrumb>
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <Breadcrumb.Item key={item.label}>
                            {isLast ? volunteerName : <Link to={item.href || '#'}>{item.label}</Link>}
                        </Breadcrumb.Item>
                    );
                })}
            </Breadcrumb>
        );
    };

    return (
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
    );
};
