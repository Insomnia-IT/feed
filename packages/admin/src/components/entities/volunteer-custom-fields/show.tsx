import { Show, Typography } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useShow } from '@pankod/refine-core';
import { FC, lazy, Suspense } from 'react';

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
