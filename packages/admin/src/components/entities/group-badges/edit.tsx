import { FC, useEffect, useMemo, useState } from 'react';
import { Edit, EditButton, TextField, useForm, useTable } from '@refinedev/antd';
import { Button, Table, Form, Typography, Space, Divider, Input, Popconfirm, Row, Col } from 'antd';
import { useUpdateMany } from '@refinedev/core';
import { DeleteOutlined } from '@ant-design/icons';

import type { DirectionEntity, GroupBadgeEntity, VolEntity } from 'interfaces';
import { CreateEdit } from './common';
import { AddVolunteerModal } from 'components/entities/group-badges/add-volunteer-modal';

const { Title } = Typography;

export const GroupBadgeEdit: FC = () => {
    const [volunteers, setVolunteers] = useState<Array<VolEntity & { markedDeleted: boolean; markedAdded: boolean }>>(
        []
    );
    const [openAdd, setOpenAdd] = useState(false);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const { mutate } = useUpdateMany();

    const { formProps, id, saveButtonProps } = useForm<GroupBadgeEntity>({
        onMutationSuccess: () => {
            const volunteersToDelete = volunteers.filter((item) => item.markedDeleted);
            const volunteersToAdd = volunteers.filter((item) => item.markedAdded);

            if (volunteersToDelete.length) {
                mutate({
                    resource: 'volunteers',
                    ids: volunteersToDelete.map((vol) => vol.id),
                    values: { group_badge: null }
                });
            }

            if (volunteersToAdd.length) {
                mutate({
                    resource: 'volunteers',
                    ids: volunteersToAdd.map((vol) => vol.id),
                    values: { group_badge: id }
                });
            }
        }
    });

    const { setFilters, tableProps: tablePropsVolunteers } = useTable<VolEntity>({
        resource: 'volunteers',
        initialFilter: [{ field: 'group_badge', operator: 'eq', value: id }],
        initialSorter: [{ field: 'id', order: 'desc' }],
        pagination: {
            current: page,
            pageSize
        }
    });

    const syncedVolunteers = useMemo(() => {
        const prevMap = new Map(volunteers.map((v) => [v.id, v]));
        return (
            tablePropsVolunteers.dataSource?.map((v) => ({
                ...v,
                markedDeleted: prevMap.get(v.id)?.markedDeleted ?? false,
                markedAdded: prevMap.get(v.id)?.markedAdded ?? false
            })) ?? []
        );
    }, [tablePropsVolunteers.dataSource, volunteers]);

    useEffect(() => {
        setVolunteers(syncedVolunteers);
    }, [syncedVolunteers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters([
            { field: 'group_badge', operator: 'eq', value: id },
            { field: 'search', operator: 'eq', value: e.target.value }
        ]);
    };

    const handleRemoveVolunteer = (record: VolEntity) => {
        setVolunteers((prev) =>
            prev.find((v) => v.id === record.id)?.markedAdded
                ? prev.filter((v) => v.id !== record.id)
                : prev.map((v) => (v.id === record.id ? { ...v, markedDeleted: true } : v))
        );
    };

    const handlePageChange = (newPage: number, newSize: number) => {
        setPage(newPage);
        setPageSize(newSize);
    };

    const pagination = {
        total:
            tablePropsVolunteers.pagination && tablePropsVolunteers.pagination.total
                ? tablePropsVolunteers.pagination.total
                : 0,
        current: page,
        pageSize: pageSize,
        showTotal: (total: number) => (
            <>
                <span data-testid="volunteer-count-caption">Волонтеров:</span>{' '}
                <span data-testid="volunteer-count-value">{total}</span>
            </>
        ),
        onChange: handlePageChange
    };

    const visibleVolunteers = volunteers.filter((v) => !v.markedDeleted);

    return (
        <Edit saveButtonProps={saveButtonProps} contentProps={{ style: { marginBottom: 60, overflow: 'auto' } }}>
            <Form {...formProps} layout="vertical">
                <CreateEdit />
                <span data-testid="volunteer-count-caption">Количество волонтеров:</span>{' '}
                <span data-testid="volunteer-count-value">{pagination.total}</span>
            </Form>

            <Divider />

            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={5}>Волонтеры</Title>
                </Col>
                <Col>
                    <Space>
                        <Input placeholder="Поиск волонтера" allowClear onChange={handleSearchChange} />
                        <Button type="primary" onClick={() => setOpenAdd(true)}>
                            Добавить волонтера
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table {...tablePropsVolunteers} dataSource={visibleVolunteers} rowKey="id" pagination={pagination}>
                <Table.Column dataIndex="name" title="Имя на бейдже" />
                <Table.Column dataIndex="first_name" title="Имя" />
                <Table.Column dataIndex="last_name" title="Фамилия" />
                <Table.Column
                    dataIndex="directions"
                    title="Службы/Локации"
                    render={(directions: DirectionEntity[]) => (
                        <TextField
                            style={{ whiteSpace: 'pre-wrap' }}
                            value={directions.map(({ name }) => name).join(', ')}
                        />
                    )}
                    ellipsis
                />
                <Table.Column
                    title="Действия"
                    render={(_, record: VolEntity) => (
                        <Space>
                            <EditButton
                                hideText
                                size="small"
                                resourceNameOrRouteName="volunteers"
                                recordItemId={record.id}
                            />
                            <Popconfirm
                                title="Уверены?"
                                okText="Удалить"
                                cancelText="Отмена"
                                okType="danger"
                                onConfirm={() => handleRemoveVolunteer(record)}
                            >
                                <Button icon={<DeleteOutlined />} danger size="small" />
                            </Popconfirm>
                        </Space>
                    )}
                />
            </Table>

            <AddVolunteerModal
                setVolunteers={setVolunteers}
                volunteers={volunteers}
                setIsOpen={setOpenAdd}
                isOpen={openAdd}
            />
        </Edit>
    );
};
