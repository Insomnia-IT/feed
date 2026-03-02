import { Edit, EditButton, TextField, useForm, useTable } from '@refinedev/antd';
import { Button, Col, Divider, Form, Input, Popconfirm, Row, Space, Table, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { type HttpError, useInvalidate, useNotification, useUpdateMany } from '@refinedev/core';

import type { DirectionEntity, GroupBadgeEntity, VolEntity } from 'interfaces';
import { useDebouncedCallback } from 'shared/hooks';
import { CreateEdit } from './common';
import { AddVolunteerModal } from './add-volunteer-modal';

const { Title, Text } = Typography;

export const GroupBadgeEdit = () => {
    const { open = () => {} } = useNotification();
    const invalidate = useInvalidate();

    const { mutate: updateMany, mutation: updateManyMutation } = useUpdateMany();
    const isUpdating = Boolean(updateManyMutation.isPending);

    const { id, formProps, saveButtonProps } = useForm<GroupBadgeEntity, HttpError>();

    const { tableProps, setFilters } = useTable<VolEntity, HttpError>({
        resource: 'volunteers',
        filters: {
            initial: [{ field: 'group_badge', operator: 'eq', value: id }]
        },
        sorters: {
            initial: [{ field: 'id', order: 'desc' }]
        },
        pagination: { pageSize: 10 }
    });

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setFilters([
            { field: 'group_badge', operator: 'eq', value: id },
            { field: 'search', operator: 'eq', value }
        ]);
    });

    const removeVolunteer = (volId: number) => {
        updateMany(
            { resource: 'volunteers', ids: [volId], values: { group_badge: null } },
            {
                onSuccess: () => {
                    invalidate({ resource: 'volunteers', invalidates: ['list'] });
                    open({ type: 'success', message: 'Волонтёр удалён' });
                },
                onError: () => open({ type: 'error', message: 'Не удалось удалить' })
            }
        );
    };

    const total = tableProps.pagination && 'total' in tableProps.pagination ? tableProps.pagination.total : 0;

    return (
        <Edit saveButtonProps={saveButtonProps} contentProps={{ style: { marginBottom: 60, overflow: 'auto' } }}>
            <Form {...formProps} layout="vertical">
                <CreateEdit />
            </Form>

            <Divider />

            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={5}>
                        Волонтёры{' '}
                        {typeof total === 'number' && (
                            <Text type="secondary" style={{ fontSize: '0.875rem' }}>
                                ({total})
                            </Text>
                        )}
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Input
                            placeholder="Поиск волонтёра"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                        <AddVolunteerModal groupBadgeId={id as number} />
                    </Space>
                </Col>
            </Row>

            <Table {...tableProps} rowKey="id" loading={tableProps.loading || isUpdating}>
                <Table.Column dataIndex="name" title="Имя на бейдже" />
                <Table.Column dataIndex="first_name" title="Имя" />
                <Table.Column dataIndex="last_name" title="Фамилия" />
                <Table.Column
                    dataIndex="directions"
                    title="Службы/Локации"
                    render={(dirs: DirectionEntity[]) => (
                        <TextField style={{ whiteSpace: 'pre-wrap' }} value={dirs.map(({ name }) => name).join(', ')} />
                    )}
                    ellipsis
                />
                <Table.Column
                    title="Действия"
                    render={(_, record: VolEntity) => (
                        <Space>
                            <EditButton hideText size="small" resource="volunteers" recordItemId={record.id} />
                            <Popconfirm
                                title="Уверены?"
                                okText="Удалить"
                                cancelText="Отмена"
                                okType="danger"
                                onConfirm={() => removeVolunteer(record.id)}
                            >
                                <Button icon={<DeleteOutlined />} danger size="small" loading={isUpdating} />
                            </Popconfirm>
                        </Space>
                    )}
                />
            </Table>
        </Edit>
    );
};
