import {
    Button,
    Edit,
    EditButton,
    Form,
    Modal,
    Space,
    Table,
    TextField,
    Typography,
    useForm,
    useTable
} from '@pankod/refine-antd';
import { Input, Popconfirm, Row, Col, Divider } from 'antd';
import { useList, useUpdateMany, IResourceComponentsProps } from '@pankod/refine-core';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableRowSelection } from 'antd/es/table/interface';
import { useEffect, useMemo, useState } from 'react';
import type { FC, Key } from 'react';

import type { GroupBadgeEntity, VolEntity } from 'interfaces';
import { useMedia } from 'shared/providers';
import useVisibleDirections from '../vols/use-visible-directions';
import { CreateEdit } from './common';

const { Title } = Typography;

export const GroupBadgeEdit: FC<IResourceComponentsProps> = () => {
    const { mutate } = useUpdateMany();
    const { isDesktop } = useMedia();

    const [volunteers, setVolunteers] = useState<Array<VolEntity & { markedDeleted: boolean; markedAdded: boolean }>>(
        []
    );
    const [openAdd, setOpenAdd] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selected, setSelected] = useState<Array<Key>>([]);

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

    const { data: volunteersAll, isLoading: isVolunteersAllLoading } = useList<VolEntity>({
        resource: 'volunteers'
    });

    const { setFilters, tableProps: currentVols } = useTable<VolEntity>({
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

    const visibleDirections = useVisibleDirections();

    useEffect(() => {
        const prevVolunteersMap = new Map(volunteers.map((vol) => [vol.id, vol]));
        const updatedVolunteers =
            currentVols.dataSource?.map((vol) => ({
                ...vol,
                markedDeleted: prevVolunteersMap.get(vol.id)?.markedDeleted ?? false,
                markedAdded: prevVolunteersMap.get(vol.id)?.markedAdded ?? false
            })) ?? [];
        setVolunteers(updatedVolunteers);
    }, [currentVols.dataSource]);

    const addVolunteers = (): void => {
        //если волонтер уже был в списке, но помечен на удаление, убираем флаг удаления
        const updatedVolunteers = volunteers.map((item) => ({
            ...item,
            markedDeleted: selected.includes(item.id) ? false : item.markedDeleted,
            markedAdded: false
        }));

        // добавляем только тех волонтеров, которых не было в списке
        const currentIds = volunteers.map((item) => item.id);
        const newVolunteers =
            volunteersAll?.data
                .filter((item) => selected.includes(item.id) && !currentIds.includes(item.id))
                .map((item) => ({
                    ...item,
                    markedDeleted: false,
                    markedAdded: true
                })) ?? [];

        setVolunteers([...updatedVolunteers, ...newVolunteers]);
        setSelected([]);
    };

    const dataSource = useMemo(() => volunteers.filter((vol) => !vol.markedDeleted), [volunteers]);

    const handleChangeInputValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
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

    /**
     * данные для попапа добавить волонтеров
     */
    const filteredData = useMemo(() => {
        //todo если волонтер уже есть в volunteers но с флагом markedDeleted
        const currentIds = volunteers.filter((item) => !item.markedDeleted).map((item) => item.id);
        const filteredVols = volunteersAll?.data.filter(
            (vol) => !visibleDirections || vol.directions?.some(({ id }) => visibleDirections.includes(id))
        );

        if (!searchText) {
            return filteredVols?.filter((item) => !currentIds.includes(item.id));
        }

        const searchTextLower = searchText.toLowerCase();
        return filteredVols?.filter((item) => {
            const isSelected = selected.includes(item.id);
            const isNotCurrent = !currentIds.includes(item.id);
            const matchesSearch = [
                item.name,
                item.first_name,
                item.last_name,
                item.directions?.map(({ name }) => name).join(', ')
            ]
                .filter(Boolean)
                .some((text) => text?.toLowerCase().includes(searchTextLower));

            return isNotCurrent && (matchesSearch || isSelected);
        });
    }, [volunteersAll, volunteers, searchText, selected, visibleDirections]);

    const rowSelection: TableRowSelection<VolEntity> = {
        selectedRowKeys: selected,
        onChange: setSelected,
        type: 'checkbox'
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
            <Table {...currentVols} dataSource={dataSource} rowKey="id">
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
                                    setVolunteers(
                                        volunteers.find((item) => item.id === record.id)?.markedAdded
                                            ? volunteers.filter((item) => item.id !== record.id)
                                            : volunteers.map((vol) =>
                                                vol.id === record.id
                                                    ? {
                                                        ...vol,
                                                        markedDeleted: true
                                                    }
                                                    : vol
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
            <Modal
                title="Добавить волонтеров"
                open={openAdd}
                onOk={() => {
                    addVolunteers();
                    setOpenAdd(false);
                }}
                onCancel={() => setOpenAdd(false)}
            >
                <Input
                    placeholder="Поиск..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                />
                <Table
                    rowSelection={rowSelection}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={isVolunteersAllLoading}
                    size="small"
                    pagination={{
                        pageSize: isDesktop ? 100 : 5,
                        showSizeChanger: false,
                        size: 'small'
                    }}
                >
                    <Table.Column dataIndex="name" key="name" title="Имя на бейдже" ellipsis width="40%" />
                    <Table.Column dataIndex="first_name" key="first_name" title="Имя" ellipsis />
                    <Table.Column dataIndex="last_name" key="last_name" title="Фамилия" ellipsis />
                </Table>
            </Modal>
        </Edit>
    );
};
