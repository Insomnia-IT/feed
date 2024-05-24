import { Show, Typography } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useShow } from '@pankod/refine-core';

import type { DirectionEntity } from '~/interfaces';

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
