import { useMemo } from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Typography, Checkbox } from 'antd';

import type { VolEntity } from 'interfaces';
import { isVolunteerActivatedStatusValue } from 'shared/helpers/volunteer-status';

const { Text, Title } = Typography;

export const VolShow = () => {
    const { query } = useShow<VolEntity>();

    const record = query.data?.data;

    const isActivated = useMemo(() => {
        const arrivals = record?.arrivals ?? [];
        return arrivals.some((a) => isVolunteerActivatedStatusValue(a.status));
    }, [record?.arrivals]);

    return (
        <Show isLoading={query.isLoading}>
            <Title level={5}>Активирован</Title>
            <Checkbox checked={isActivated} disabled />

            <Title level={5}>Заблокирован</Title>
            <Checkbox checked={!!record?.is_blocked} disabled />

            <Title level={5}>Имя</Title>
            <Text>{record?.first_name || 'Не указано'}</Text>

            <Title level={5}>Должность</Title>
            <Text>{record?.position || 'Не указана'}</Text>
        </Show>
    );
};
