import { FC, lazy, Suspense } from 'react';
import { Typography } from 'antd';
import { Show } from '@refinedev/antd';
import { useShow, IResourceComponentsProps } from '@refinedev/core';

import type { VolunteerCustomFieldEntity } from 'interfaces';

const ReactQuill = lazy(() => import('react-quill'));

const { Text, Title } = Typography;

export const VolunteerCustomFieldShow: FC<IResourceComponentsProps> = () => {
    const { queryResult } = useShow<VolunteerCustomFieldEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>Комментарий</Title>
            <Suspense fallback={<div>Loading editor...</div>}>
                <ReactQuill theme="bubble" readOnly value={record?.comment} />
            </Suspense>
        </Show>
    );
};
