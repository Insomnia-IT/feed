import { FC } from 'react';
import { Typography } from 'antd';
import { Show } from '@refinedev/antd';
import { useShow, IResourceComponentsProps } from '@refinedev/core';
import { TextEditor } from 'components/controls/text-editor';

import type { VolunteerCustomFieldEntity } from 'interfaces';

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
            <TextEditor theme="bubble" readOnly value={record?.comment} />
        </Show>
    );
};
