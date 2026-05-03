import { DeleteOutlined } from '@ant-design/icons';
import { EditButton, TextField, useTable } from '@refinedev/antd';
import { Button, Input, Popconfirm, Space, Table, Typography } from 'antd';
import { type HttpError, useInvalidate, useNotification, useUpdateMany } from '@refinedev/core';

import type { DirectionEntity, VolEntity } from 'interfaces';
import { useDebouncedCallback } from 'shared/hooks';
import { AddVolunteerModal } from '../../add-volunteer-modal/add-volunteer-modal';
import styles from './volunteers-tab.module.css';

const { Text, Title } = Typography;

interface VolunteersTabProps {
    groupBadgeId: number;
}

export const VolunteersTab = ({ groupBadgeId }: VolunteersTabProps) => {
    const { open = () => {} } = useNotification();
    const invalidate = useInvalidate();
    const { mutate: updateMany, mutation: updateManyMutation } = useUpdateMany();
    const isUpdating = Boolean(updateManyMutation.isPending);

    const { tableProps, setFilters } = useTable<VolEntity, HttpError>({
        resource: 'volunteers',
        filters: {
            initial: [{ field: 'group_badge', operator: 'eq', value: groupBadgeId }]
        },
        sorters: {
            initial: [{ field: 'name', order: 'asc' }]
        },
        pagination: { pageSize: 10 }
    });

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setFilters([
            { field: 'group_badge', operator: 'eq', value: groupBadgeId },
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
        <>
            <div className={styles.header}>
                <Title level={5} className={styles.title}>
                    Волонтёры{' '}
                    {typeof total === 'number' && (
                        <Text type="secondary" className={styles.total} data-testid="group-badge-volunteer-count">
                            ({total})
                        </Text>
                    )}
                </Title>
                <div className={styles.actions}>
                    <Input
                        className={styles.search}
                        placeholder="Поиск волонтёра"
                        allowClear
                        onChange={(e) => debouncedSearch(e.target.value)}
                    />
                    <AddVolunteerModal groupBadgeId={groupBadgeId} />
                </div>
            </div>

            <Table
                {...tableProps}
                rowKey="id"
                loading={tableProps.loading || isUpdating}
                pagination={
                    tableProps.pagination
                        ? {
                              ...tableProps.pagination,
                              showTotal: (itemsTotal) => `Всего: ${itemsTotal}`
                          }
                        : false
                }
            >
                <Table.Column dataIndex="name" title="Имя на бейдже" />
                <Table.Column dataIndex="first_name" title="Имя" />
                <Table.Column dataIndex="last_name" title="Фамилия" />
                <Table.Column
                    dataIndex="directions"
                    title="Службы/Локации"
                    render={(dirs: DirectionEntity[]) => (
                        <TextField className={styles.directions} value={dirs.map(({ name }) => name).join(', ')} />
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
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    size="small"
                                    loading={isUpdating}
                                    data-testid={`group-badge-remove-volunteer-${record.id}`}
                                />
                            </Popconfirm>
                        </Space>
                    )}
                />
            </Table>
        </>
    );
};
