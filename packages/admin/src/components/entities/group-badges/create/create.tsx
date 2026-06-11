import { Create, useForm } from '@refinedev/antd';
import { Form } from 'antd';

import type { GroupBadgeEntity } from 'interfaces';
import { useLocalStorage } from 'shared/hooks';

import { CreateEdit } from '../common';
import styles from './create.module.css';

export const GroupBadgeCreate = () => {
    const { setItem } = useLocalStorage();
    const { form, formProps, saveButtonProps } = useForm<GroupBadgeEntity>({
        onMutationSuccess: () => {
            setItem('gbPageIndex', '1');
        }
    });

    return (
        <Create saveButtonProps={saveButtonProps} contentProps={{ className: styles.content }}>
            <Form {...formProps} form={form} scrollToFirstError layout="vertical">
                <CreateEdit />
            </Form>
        </Create>
    );
};
