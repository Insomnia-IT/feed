import { useMemo, useState } from 'react';
import { Button, Input, Modal, Table } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { useInvalidate, useList, useNotification, useUpdateMany } from '@refinedev/core';

import type { VolEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { useDebouncedCallback } from 'shared/hooks';
import useVisibleDirections from '../../vols/use-visible-directions';
import styles from './add-volunteer-modal.module.css';

export const AddVolunteerModal = ({ groupBadgeId }: { groupBadgeId: number }) => {
    const [isOpenModal, setOpenModal] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<(string | number | bigint)[]>([]);
    const [page, setPage] = useState(1);

    const { isDesktop } = useScreen();
    const visibleDirections = useVisibleDirections();

    const invalidate = useInvalidate();
    const { open = () => {} } = useNotification();
    const { mutate: updateMany } = useUpdateMany();

    const pageSize = isDesktop ? 10 : 5;

    const resource = useMemo(() => {
        const params = new URLSearchParams();

        if (search) {
            params.set('search', search);
        }

        visibleDirections?.forEach((directionId) => {
            params.append('directions', directionId);
        });

        const query = params.toString();
        return query ? `volunteers/?${query}` : 'volunteers';
    }, [search, visibleDirections]);

    const { result, query } = useList<VolEntity>({
        resource,
        pagination: {
            mode: 'server',
            currentPage: page,
            pageSize
        }
    });

    const volunteers = result.data ?? [];
    const total = result.total ?? 0;
    const isLoading = query.isLoading;

    const rowSelection: TableRowSelection<VolEntity> = {
        selectedRowKeys: selectedIds,
        onChange: (keys) => setSelectedIds(keys),
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
                    className={styles.search}
                    placeholder="Поиск..."
                    allowClear
                    onChange={(e) => debouncedSearch(e.target.value)}
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
                        showTotal: (itemsTotal) => `Всего: ${itemsTotal}`,
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
