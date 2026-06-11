import { useState } from 'react';
import { Edit, useForm } from '@refinedev/antd';
import { Form } from 'antd';
import { type HttpError } from '@refinedev/core';

import type { GroupBadgeEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { createFormMainTabFinishFailedHandler } from 'shared/utils/create-form-main-tab-finish-failed-handler';
import { GroupBadgeTabs } from './group-badge-tabs/group-badge-tabs';
import styles from './group-badge-edit.module.css';

export const GroupBadgeEdit = () => {
    const { id, formProps, saveButtonProps, form } = useForm<GroupBadgeEntity, HttpError>();
    const { onFinishFailed: upstreamOnFinishFailed, ...restFormProps } = formProps;
    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');
    const shouldHideFooterActions = !isDesktop && activeKey !== '1';

    const handleFinishFailed = createFormMainTabFinishFailedHandler({
        form,
        setActiveKey,
        upstream: upstreamOnFinishFailed
    });

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
