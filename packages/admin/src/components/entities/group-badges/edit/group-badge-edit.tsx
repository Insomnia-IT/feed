import { useState } from 'react';
import { Edit, useForm } from '@refinedev/antd';
import { Form } from 'antd';
import { type HttpError } from '@refinedev/core';

import type { GroupBadgeEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { GroupBadgeTabs } from './group-badge-tabs/group-badge-tabs';
import styles from './group-badge-edit.module.css';

export const GroupBadgeEdit = () => {
    const { id, formProps, saveButtonProps } = useForm<GroupBadgeEntity, HttpError>();
    const { isDesktop } = useScreen();
    const [activeKey, setActiveKey] = useState('1');
    const shouldHideFooterActions = !isDesktop && activeKey !== '1';

    return (
        <Edit
            saveButtonProps={saveButtonProps}
            contentProps={{
                ...(shouldHideFooterActions ? { actions: [] } : {}),
                className: styles.content
            }}
        >
            <Form {...formProps} scrollToFirstError layout="vertical">
                <GroupBadgeTabs activeKey={activeKey} groupBadgeId={id} onChange={setActiveKey} />
            </Form>
        </Edit>
    );
};
