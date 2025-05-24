import { FC } from 'react';
import { Show } from '@refinedev/antd';
import { Typography } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';
import { useShow } from '@refinedev/core';

import type { DirectionEntity } from 'interfaces';

const { Text, Title } = Typography;

export const DirectionShow: FC<IResourceComponentsProps> = () => {
    const { queryResult } = useShow<DirectionEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>
            <Title level={5}>Тип</Title>
            <Text>{record?.type.name}</Text>
        </Show>
    );
};
