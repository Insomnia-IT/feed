import { Show, Typography } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useShow } from '@pankod/refine-core';
import dynamic from 'next/dynamic';

import type { VolunteerCustomFieldEntity } from '~/interfaces';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const { Text, Title } = Typography;

export const VolunteerCustomFieldShow: FC<IResourceComponentsProps> = () => {
    const { queryResult, showId } = useShow<VolunteerCustomFieldEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>Комментарий</Title>
            <ReactQuill theme='bubble' readOnly value={record?.comment} />
        </Show>
    );
};
