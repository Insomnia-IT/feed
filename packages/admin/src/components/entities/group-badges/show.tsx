import { EditButton, Show, Space, Table, TextField, Typography, useTable } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useShow } from '@pankod/refine-core';
import dynamic from 'next/dynamic';

import type { GroupBadgeEntity, VolEntity } from '~/interfaces';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const { Text, Title } = Typography;

export const GroupBadgeShow: FC<IResourceComponentsProps> = () => {
    const { queryResult, showId } = useShow<GroupBadgeEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    const { tableProps } = useTable<VolEntity>({
        resource: 'volunteers',
        initialFilter: [
            {
                field: 'group_badge',
                operator: 'eq',
                value: showId
            }
        ],
        initialSorter: [
            {
                field: 'id',
                order: 'desc'
            }
        ]
    });

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>QR</Title>
            <Text>{record?.qr}</Text>

            <Title level={5}>Комментарий</Title>
            <ReactQuill theme='bubble' readOnly value={record?.comment} />

            <Title level={5}>Волонтеры</Title>
            <Table {...tableProps} rowKey='id'>
                <Table.Column
                    dataIndex='nickname'
                    key='nickname'
                    title='Позывной'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column dataIndex='name' key='name' title='Имя' render={(value) => <TextField value={value} />} />
                <Table.Column
                    dataIndex='lastname'
                    key='lastname'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='departments'
                    key='departments    '
                    title='Службы'
                    render={(value) => <TextField value={value.map(({ name }) => name).join(', ')} />}
                />
                <Table.Column<GroupBadgeEntity>
                    title='Действия'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton
                                hideText
                                size='small'
                                resourceNameOrRouteName='volunteers'
                                recordItemId={record.id}
                            />
                        </Space>
                    )}
                />
            </Table>
        </Show>
    );
};
