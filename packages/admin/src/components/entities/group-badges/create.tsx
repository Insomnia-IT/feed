import { Create, Form, useForm } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import type { GroupBadgeEntity } from '~/interfaces';
import { CreateEdit } from './common';

export const GroupBadgeCreate: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<GroupBadgeEntity>();

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />
            </Form>
        </Create>
    );
};
