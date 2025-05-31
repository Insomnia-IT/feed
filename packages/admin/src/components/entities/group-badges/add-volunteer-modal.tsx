import { FC, useState } from 'react';
import { Button, Input, Modal, Table } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { CrudFilters, useInvalidate, useList, useNotification, useUpdateMany } from '@refinedev/core';

import type { VolEntity } from 'interfaces';
import { useMedia } from 'shared/providers';
import { useDebouncedCallback } from 'shared/hooks';
import useVisibleDirections from '../vols/use-visible-directions';

export const AddVolunteerModal: FC<{ groupBadgeId: number }> = ({ groupBadgeId }) => {
    const [isOpenModal, setOpenModal] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<React.Key[]>([]);
    const [page, setPage] = useState(1);

    const { isDesktop } = useMedia();
    const visibleDirections = useVisibleDirections();

    const invalidate = useInvalidate();
    const { open = () => {} } = useNotification();
    const { mutate: updateMany } = useUpdateMany();

    const pageSize = isDesktop ? 10 : 5;

    const serverFilters: CrudFilters = [];
    if (search) {
        serverFilters.push({
            field: 'search',
            operator: 'eq',
            value: search
        });
    }

    const { data, isLoading } = useList<VolEntity>({
        resource: 'volunteers',
        filters: serverFilters,
        pagination: {
            mode: 'server',
            current: page,
            pageSize
        }
    });

    const volunteersRaw = data?.data ?? [];
    const total = data?.total ?? 0;

    const volunteers = volunteersRaw.filter((v) =>
        visibleDirections ? v.directions?.some(({ id }) => visibleDirections.includes(id)) : true
    );

    const rowSelection: TableRowSelection<VolEntity> = {
        selectedRowKeys: selectedIds,
        onChange: setSelectedIds,
        preserveSelectedRowKeys: true
    };

    const addVols = () => {
        updateMany(
            {
                resource: 'volunteers',
                ids: selectedIds as number[],
                values: { group_badge: groupBadgeId }
            },
            {
                onSuccess: () => {
                    invalidate({ resource: 'volunteers', invalidates: ['list'] });
                    open({ type: 'success', message: 'Волонтеры добавлены' });
                    setOpenModal(false);
                    setSelectedIds([]);
                },
                onError: () => open({ type: 'error', message: 'Не удалось добавить' })
            }
        );
    };

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setSearch(value);
        setPage(1);
    });

    return (
        <>
            <Button type="primary" onClick={() => setOpenModal(true)}>
                Добавить волонтера
            </Button>

            <Modal
                title="Добавить волонтеров"
                open={isOpenModal}
                onOk={addVols}
                onCancel={() => setOpenModal(false)}
                okButtonProps={{ disabled: !selectedIds.length }}
            >
                <Input
                    placeholder="Поиск..."
                    allowClear
                    onChange={(e) => debouncedSearch(e.target.value)}
                    style={{ marginBottom: 16 }}
                />

                <Table
                    rowSelection={rowSelection}
                    dataSource={volunteers}
                    rowKey="id"
                    loading={isLoading}
                    size="small"
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: false,
                        onChange: (p) => setPage(p)
                    }}
                >
                    <Table.Column dataIndex="name" title="Имя на бейдже" ellipsis width="40%" />
                    <Table.Column dataIndex="first_name" title="Имя" ellipsis />
                    <Table.Column dataIndex="last_name" title="Фамилия" ellipsis />
                </Table>
            </Modal>
        </>
    );
};
