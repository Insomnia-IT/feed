import { useEffect, useState, type FC } from 'react';
import { DeleteButton, EditButton, List } from '@refinedev/antd';
import { Space, Table, TablePaginationConfig, Tooltip } from 'antd';
import { useList, useNavigation } from '@refinedev/core';

import type { GroupBadgeEntity } from 'interfaces';
import { useScreen } from 'shared/providers';
import { getSorter } from 'utils';
import useVisibleDirections from '../vols/use-visible-directions';

import styles from './group-badge-list.module.css';

const LS_PAGE_KEY = 'gbPageIndex';
const LS_SIZE_KEY = 'gbPageSize';

export const GroupBadgeList: FC = () => {
    const [page, setPage] = useState<number>(Number(localStorage.getItem(LS_PAGE_KEY)) || 1);
    const [pageSize, setPageSize] = useState<number>(Number(localStorage.getItem(LS_SIZE_KEY)) || 10);

    const visibleDirections = useVisibleDirections();
    const { isDesktop } = useScreen();
    const { edit } = useNavigation();
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        config: {
            pagination: {
                current: isDesktop ? page : 1,
                pageSize: isDesktop ? pageSize : 10000
            }
        }
    });

    useEffect(() => {
        // Если текущая страница выходит за пределы общего количества бейджей, сбрасываем на 1
        if (groupBadges?.total && (page - 1) * pageSize >= groupBadges.total) {
            setPage(1);
            localStorage.setItem(LS_PAGE_KEY, '1');
        }
    }, [groupBadges?.total, page, pageSize]);

    const pagination: TablePaginationConfig = {
        total: groupBadges?.total ?? 1,
        showTotal: (total) => `Кол-во групповых бейджей: ${total}`,
        current: page,
        pageSize: pageSize,
        onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
            localStorage.setItem(LS_PAGE_KEY, String(newPage));
            localStorage.setItem(LS_SIZE_KEY, String(newPageSize));
        }
    };

    const data =
        groupBadges?.data.filter((item) => {
            return !visibleDirections || (item.direction && visibleDirections.includes(item.direction.id));
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
                                <Tooltip title={badge.direction?.name}>
                                    <span>{badge.direction?.name || '-'}</span>
                                </Tooltip>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Волонтеры:</span>
                                <span>{badge.volunteer_count || '0'}</span>
                            </div>
                            {badge.comment && (
                                <div className={styles.comment}>
                                    <span className={styles.label}>Комментарий:</span>
                                    <div dangerouslySetInnerHTML={{ __html: badge.comment }} />
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
                            <Tooltip title={value}>
                                <div className={styles.ellipsis} dangerouslySetInnerHTML={{ __html: value }} />
                            </Tooltip>
                        )}
                        ellipsis
                    />
                </Table>
            )}
        </List>
    );
};
