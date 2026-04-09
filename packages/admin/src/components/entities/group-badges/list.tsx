import { useEffect, useState, startTransition } from 'react';
import { DeleteButton, EditButton, List } from '@refinedev/antd';
import { Space, Table, type TablePaginationConfig, Tooltip } from 'antd';
import { useList, useNavigation } from '@refinedev/core';

import { RichTextPreview } from 'components/controls/rich-text-preview';
import type { GroupBadgeEntity } from 'interfaces';
import { useLocalStorage } from 'shared/hooks';
import { useScreen } from 'shared/providers';
import { getSorter } from 'utils';
import useVisibleDirections from '../vols/use-visible-directions';

import styles from './group-badge-list.module.css';

const LS_PAGE_KEY = 'gbPageIndex';
const LS_SIZE_KEY = 'gbPageSize';

const getDirectionName = (direction: GroupBadgeEntity['direction']): string => {
    if (!direction) {
        return '-';
    }

    return typeof direction === 'string' ? direction : direction.name;
};

export const GroupBadgeList = () => {
    const { getItem, setItem } = useLocalStorage();
    const [page, setPage] = useState<number>(Number(getItem(LS_PAGE_KEY)) || 1);
    const [pageSize, setPageSize] = useState<number>(Number(getItem(LS_SIZE_KEY)) || 10);

    const visibleDirections = useVisibleDirections();
    const { isDesktop } = useScreen();
    const { edit } = useNavigation();
    const { result: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        pagination: {
            mode: 'server',
            currentPage: isDesktop ? page : 1,
            pageSize: isDesktop ? pageSize : 10000
        }
    });

    useEffect(() => {
        if (!isDesktop) return;

        const total = groupBadges?.total;
        if (!total) return;
        // Если текущая страница выходит за пределы общего количества бейджей, сбрасываем на 1
        const maxPage = Math.max(1, Math.ceil(total / pageSize));
        if (page > maxPage) {
            startTransition(() => setPage(1));
            setItem(LS_PAGE_KEY, '1');
        }
    }, [isDesktop, groupBadges?.total, page, pageSize, setItem]);

    const pagination: TablePaginationConfig = {
        total: groupBadges?.total ?? 1,
        showTotal: (total) => `Кол-во групповых бейджей: ${total}`,
        current: page,
        pageSize,
        showSizeChanger: true,
        onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
            setItem(LS_PAGE_KEY, String(newPage));
            setItem(LS_SIZE_KEY, String(newPageSize));
        }
    };

    const data =
        groupBadges?.data.filter((item) => {
            return (
                !visibleDirections ||
                (item.direction && typeof item.direction !== 'string' && visibleDirections.includes(item.direction.id))
            );
        }) ?? [];

    return (
        <List>
            {!isDesktop ? (
                <div className={styles.mobileList}>
                    {data.map((badge) => (
                        <div
                            key={badge.id}
                            className={styles.card}
                            onClick={(e) => {
                                const target = e.target as HTMLElement;
                                //TODO: поискать решение через e.stopPropagation() на Popconfirm у DeleteButton
                                if (target.closest('.ant-btn') || target.closest('.ant-modal')) {
                                    return;
                                }

                                edit('group-badges', badge.id);
                            }}
                        >
                            <div className={styles.header}>
                                <Tooltip title={badge.name}>
                                    <span className={styles.name}>{badge.name}</span>
                                </Tooltip>
                                <Space>
                                    <DeleteButton hideText size="small" recordItemId={badge.id} />
                                </Space>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Направление:</span>
                                <Tooltip title={getDirectionName(badge.direction)}>
                                    <span>{getDirectionName(badge.direction)}</span>
                                </Tooltip>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Волонтеры:</span>
                                <span>{badge.volunteer_count || '0'}</span>
                            </div>
                            {badge.comment && (
                                <div className={styles.comment}>
                                    <span className={styles.label}>Комментарий:</span>
                                    <RichTextPreview html={badge.comment} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <Table dataSource={data} rowKey="id" pagination={pagination}>
                    <Table.Column<GroupBadgeEntity>
                        title=""
                        dataIndex="actions"
                        render={(_, record) => (
                            <Space>
                                <EditButton hideText size="small" recordItemId={record.id} />
                                <DeleteButton hideText size="small" recordItemId={record.id} />
                            </Space>
                        )}
                    />
                    <Table.Column dataIndex="name" key="name" title="Название" sorter={getSorter('name')} ellipsis />
                    <Table.Column
                        dataIndex={['direction', 'name']}
                        key="direction"
                        title="Служба/Направление"
                        ellipsis
                    />
                    <Table.Column
                        dataIndex="volunteer_count"
                        key="volunteer_count"
                        title="Количество волонтеров"
                        ellipsis
                    />
                    <Table.Column
                        dataIndex="comment"
                        key="comment"
                        title="Комментарий"
                        render={(value) => (
                            <Tooltip title={<RichTextPreview html={value} />}>
                                <RichTextPreview className={styles.ellipsis} html={value} />
                            </Tooltip>
                        )}
                        ellipsis
                    />
                </Table>
            )}
        </List>
    );
};
