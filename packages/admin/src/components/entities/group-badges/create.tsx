import { Create, useForm } from '@refinedev/antd';
import { Form } from 'antd';

import type { GroupBadgeEntity } from 'interfaces';
import { useLocalStorage } from 'shared/hooks';

import { CreateEdit } from './common';

export const GroupBadgeCreate = () => {
    const { setItem } = useLocalStorage();
    const { form, formProps, saveButtonProps } = useForm<GroupBadgeEntity>({
        onMutationSuccess: () => {
            setItem('gbPageIndex', '1');
        }
    });

    return (
        <Create
            saveButtonProps={saveButtonProps}
            contentProps={{
                style: {
                    marginBottom: 60,
                    overflow: 'auto'
                }
            }}
        >
            <Form {...formProps} form={form} scrollToFirstError layout="vertical">
                <CreateEdit />
            </Form>
        </Create>
    );
};
