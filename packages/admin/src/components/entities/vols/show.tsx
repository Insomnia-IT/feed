import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Typography, Checkbox } from 'antd';
import { FC } from 'react';

import type { VolEntity } from 'interfaces';
import { isVolunteerActivatedStatusValue } from 'shared/helpers/volunteer-status';

const { Text, Title } = Typography;

export const VolShow: FC = () => {
    const { queryResult } = useShow<VolEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Активирован</Title>
            <Checkbox
                checked={record?.arrivals?.some(({ status }) => isVolunteerActivatedStatusValue(status))}
                disabled
            />

            <Title level={5}>Заблокирован</Title>
            <Checkbox checked={record?.is_blocked} disabled />

            <Title level={5}>Имя</Title>
            <Text>{record?.first_name || 'Не указано'}</Text>

            <Title level={5}>Должность</Title>
            <Text>{record?.position || 'Не указана'}</Text>
        </Show>
    );
};
