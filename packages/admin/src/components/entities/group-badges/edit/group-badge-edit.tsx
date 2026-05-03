import { useState } from 'react';
import { Edit, useForm } from '@refinedev/antd';
import { Form, type FormProps } from 'antd';
import { type HttpError } from '@refinedev/core';

import type { GroupBadgeEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { GroupBadgeTabs } from './group-badge-tabs/group-badge-tabs';
import styles from './group-badge-edit.module.css';

/** Поля вкладки «Основное» (CreateEdit) — см. при map новых вкладок с полями формы */
const GROUP_BADGE_MAIN_TAB_FIELDS = ['name', 'direction', 'role', 'qr', 'comment'] as const;

const validationFieldTabKey = (fieldName: (string | number)[]): string => {
    const segment = fieldName[0];

    if (typeof segment === 'string' && (GROUP_BADGE_MAIN_TAB_FIELDS as readonly string[]).includes(segment)) {
        return '1';
    }

    return '1';
};

export const GroupBadgeEdit = () => {
    const { id, formProps, saveButtonProps, form } = useForm<GroupBadgeEntity, HttpError>();
    const { onFinishFailed: upstreamOnFinishFailed, ...restFormProps } = formProps;
    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');
    const shouldHideFooterActions = !isDesktop && activeKey !== '1';

    const handleFinishFailed: NonNullable<FormProps['onFinishFailed']> = (errorInfo) => {
        const sorted = [...(errorInfo.errorFields ?? [])].sort((a, b) =>
            String(a.name?.[0]).localeCompare(String(b.name?.[0]))
        );
        const first = sorted.find((field) => field.name?.length);
        const namePath = first?.name;

        if (namePath?.length) {
            setActiveKey(validationFieldTabKey(namePath));
            window.setTimeout(() => {
                void form.scrollToField(namePath, { behavior: 'smooth', block: 'nearest', focus: true });
            }, 100);
        }

        upstreamOnFinishFailed?.(errorInfo);
    };

    return (
        <Edit
            saveButtonProps={saveButtonProps}
            contentProps={{
                ...(shouldHideFooterActions ? { actions: [] } : {}),
                className: styles.content
            }}
        >
            <Form {...restFormProps} layout="vertical" scrollToFirstError onFinishFailed={handleFinishFailed}>
                <GroupBadgeTabs activeKey={activeKey} groupBadgeId={id} onChange={setActiveKey} />
            </Form>
        </Edit>
    );
};
