import { Show } from '@refinedev/antd';
import { Typography } from 'antd';
import { useShow } from '@refinedev/core';

import type { DirectionEntity } from 'interfaces';

const { Text, Title } = Typography;

export const DirectionShow = () => {
    const {
        result: record,
        query: { isFetching }
    } = useShow<DirectionEntity>();

    return (
        <Show isLoading={isFetching}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>
            <Title level={5}>Тип</Title>
            <Text>{record?.type.name}</Text>
        </Show>
    );
};
