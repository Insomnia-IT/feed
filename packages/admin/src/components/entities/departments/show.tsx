import { Show, Typography } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useShow } from '@pankod/refine-core';

import type { DepartmentEntity } from '~/interfaces';

const { Text, Title } = Typography;

export const DepartmentShow: FC<IResourceComponentsProps> = () => {
    const { queryResult } = useShow<DepartmentEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Name</Title>
            <Text>{record?.name}</Text>
            <Title level={5}>Location</Title>
            {/* @ts-ignore */}
            <Text>{record?.lead}</Text>
        </Show>
    );
};
