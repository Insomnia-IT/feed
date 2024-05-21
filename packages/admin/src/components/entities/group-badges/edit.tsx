import {
    Button,
    Edit,
    EditButton,
    Form,
    Space,
    Table,
    TextField,
    Typography,
    useForm,
    useTable
} from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useTranslate, useUpdateMany } from '@pankod/refine-core';
import { DeleteOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';

import 'react-mde/lib/styles/css/react-mde-all.css';

import { useEffect, useMemo, useState } from 'react';

import type { GroupBadgeEntity, VolEntity } from '~/interfaces';

import { CreateEdit } from './common';

const { Title } = Typography;

export const GroupBadgeEdit: FC<IResourceComponentsProps> = () => {
    const translate = useTranslate();

    const [volunteers, setVolunteers] = useState<Array<VolEntity & { markedDeleted: boolean }>>([]);

    const { mutate } = useUpdateMany();

    const { formProps, id, saveButtonProps } = useForm<GroupBadgeEntity>({
        onMutationSuccess: () => {
            mutate({
                resource: 'volunteers',
                ids: volunteers.filter((vol) => vol.markedDeleted).map((vol) => vol.id),
                values: { group_badge: null }
            });
        }
    });

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

    useEffect(
        () =>
            setVolunteers(
                (prevState) =>
                    tableProps.dataSource?.map((vol) => ({
                        ...vol,
                        markedDeleted: prevState.find((prevVol) => prevVol.id === vol.id)?.markedDeleted ?? false
                    })) ?? []
            ),
        [tableProps.dataSource]
    );

    const dataSource = useMemo(() => volunteers.filter((vol) => !vol.markedDeleted), [volunteers]);

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />
            </Form>
            <Title level={5}>Волонтеры</Title>
            <Table {...tableProps} dataSource={dataSource} rowKey='id'>
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя на бейдже'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='first_name'
                    key='first_name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='last_name'
                    key='last_name'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='directions'
                    key='directions'
                    title='Службы/Локации'
                    render={(value) => <TextField value={value.map(({ name }) => name).join(', ')} />}
                />
                <Table.Column<Pick<VolEntity, 'id'>>
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
                            <Popconfirm
                                title={translate('buttons.confirm', 'Are you sure?')}
                                okText={translate('buttons.delete', 'Delete')}
                                cancelText={translate('buttons.cancel', 'Cancel')}
                                okType='danger'
                                onConfirm={(): void => {
                                    const index = volunteers.findIndex((vol) => vol.id === record.id);
                                    if (index > -1)
                                        setVolunteers(
                                            volunteers.map((vol, i) =>
                                                i === index ? ((vol.markedDeleted = true), vol) : vol
                                            )
                                        );
                                }}
                            >
                                <Button icon={<DeleteOutlined />} danger size='small' />
                            </Popconfirm>
                        </Space>
                    )}
                />
            </Table>
        </Edit>
    );
};
