import { Typography } from 'antd';
import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { TextEditor } from 'components/controls/text-editor';

import type { VolunteerCustomFieldEntity } from 'interfaces';

const { Text, Title } = Typography;

export const VolunteerCustomFieldShow = () => {
    const { result: record, query } = useShow<VolunteerCustomFieldEntity>();

    return (
        <Show isLoading={query.isLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>
            <Title level={5}>Комментарий</Title>
            <TextEditor theme="bubble" readOnly value={record?.comment} />
        </Show>
    );
};
