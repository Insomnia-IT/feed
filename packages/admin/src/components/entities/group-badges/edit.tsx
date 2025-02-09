import { Edit, EditButton, TextField, useForm, useTable } from '@refinedev/antd';
import { Button, Table, Form, Typography, Space, Divider, Input, Popconfirm, Row, Col } from 'antd';
import { useUpdateMany } from '@refinedev/core';
import { DeleteOutlined } from '@ant-design/icons';
import { FC, useEffect, useState } from 'react';

import type { GroupBadgeEntity, VolEntity } from 'interfaces';
import { CreateEdit } from './common';
import { AddVolunteerModal } from 'components/entities/group-badges/add-volunteer-modal';

const { Title } = Typography;

export const GroupBadgeEdit: FC = () => {
    const { mutate } = useUpdateMany();

    const [volunteers, setVolunteers] = useState<Array<VolEntity & { markedDeleted: boolean; markedAdded: boolean }>>(
        []
    );

    const [openAdd, setOpenAdd] = useState(false);

    const { formProps, id, saveButtonProps } = useForm<GroupBadgeEntity>({
        onMutationSuccess: () => {
            const volunteersToDelete = volunteers.filter((item) => item.markedDeleted);
            const volunteersToAdd = volunteers.filter((item) => item.markedAdded);

            if (volunteersToDelete.length > 0) {
                mutate({
                    resource: 'volunteers',
                    ids: volunteersToDelete.map((vol) => vol.id),
                    values: { group_badge: null }
                });
            }

            if (volunteersToAdd.length > 0) {
                mutate({
                    resource: 'volunteers',
                    ids: volunteersToAdd.map((vol) => vol.id),
                    values: { group_badge: id }
                });
            }
        }
    });

    const { setFilters, tableProps: currentVolsTableParams } = useTable<VolEntity>({
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
        ],
        hasPagination: false,
        initialPageSize: 10000
    });

    useEffect(() => {
        console.log('called!');

        // По идее, тут дополняем данные полями 'markedDeleted' и 'markedAdded' и записываем их в volunteers
        setVolunteers((prevVolunteers) => {
            const prevVolunteersMap = new Map(prevVolunteers.map((vol) => [vol.id, vol]));

            return (
                currentVolsTableParams.dataSource?.map((vol) => ({
                    ...vol,
                    markedDeleted: prevVolunteersMap.get(vol.id)?.markedDeleted ?? false,
                    markedAdded: prevVolunteersMap.get(vol.id)?.markedAdded ?? false
                })) ?? []
            );
        });
    }, [currentVolsTableParams.dataSource]);

    const handleChangeInputValue = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        setFilters([
            {
                field: 'group_badge',
                operator: 'eq',
                value: id
            },
            {
                field: 'search',
                operator: 'eq',
                value
            }
        ]);
    };

    const activeVolunteers = volunteers.filter((item) => !item.markedDeleted);

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <CreateEdit />
                <span>Количество волонтеров: {activeVolunteers?.length}</span>
            </Form>
            <Divider />
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={5}>Волонтеры</Title>
                </Col>
                <Col>
                    <Space>
                        <Input placeholder="Поиск волонтера" allowClear onChange={handleChangeInputValue} />
                        <Button type="primary" onClick={() => setOpenAdd(true)}>
                            Добавить волонтера
                        </Button>
                    </Space>
                </Col>
            </Row>
            <Table {...currentVolsTableParams} dataSource={activeVolunteers} rowKey="id">
                <Table.Column dataIndex="name" key="name" title="Имя на бейдже" />
                <Table.Column dataIndex="first_name" key="first_name" title="Имя" />
                <Table.Column dataIndex="last_name" key="last_name" title="Фамилия" />
                <Table.Column
                    dataIndex="directions"
                    key="directions"
                    title="Службы/Локации"
                    render={(directions) => (
                        <TextField
                            style={{ whiteSpace: 'pre-wrap' }}
                            value={directions.map(({ name }: { name: string }) => name).join(', ')}
                        />
                    )}
                    ellipsis
                />
                <Table.Column
                    title="Действия"
                    dataIndex="actions"
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
                                onConfirm={(): void => {
                                    setVolunteers((prevVolunteers) =>
                                        prevVolunteers.find((item) => item.id === record.id)?.markedAdded
                                            ? prevVolunteers.filter((item) => item.id !== record.id)
                                            : prevVolunteers.map((vol) =>
                                                  vol.id === record.id ? { ...vol, markedDeleted: true } : vol
                                              )
                                    );
                                }}
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
