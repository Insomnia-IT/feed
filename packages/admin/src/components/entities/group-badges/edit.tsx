import { Edit, EditButton, Form, Space, Table, TextField, Typography, useForm, useTable } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';

import 'react-mde/lib/styles/css/react-mde-all.css';

import type { GroupBadgeEntity, VolEntity } from '~/interfaces';

import { CreateEdit } from './common';

const { Title } = Typography;

export const GroupBadgeEdit: FC<IResourceComponentsProps> = () => {
    const { formProps, id, saveButtonProps } = useForm<GroupBadgeEntity>();

    const { tableProps } = useTable<VolEntity>({
        resource: 'volunteers',
        initialFilter: [
            {
                field: 'group_badge',
                operator: 'eq',
                value: id
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
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />

                <Title level={5}>Волонтеры</Title>
                <Table {...tableProps} rowKey='id'>
                    <Table.Column
                        dataIndex='nickname'
                        key='nickname'
                        title='Позывной'
                        render={(value) => <TextField value={value} />}
                    />
                    <Table.Column
                        dataIndex='name'
                        key='name'
                        title='Имя'
                        render={(value) => <TextField value={value} />}
                    />
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
            </Form>
        </Edit>
    );
};
