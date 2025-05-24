import { DeleteButton, EditButton, List } from '@refinedev/antd';
import { Space, Table, TablePaginationConfig, Tooltip } from 'antd';
import { useList, useNavigation } from '@refinedev/core';
import { useState, type FC } from 'react';

import type { GroupBadgeEntity } from 'interfaces';
import { useMedia } from 'shared/providers';
import { getSorter } from 'utils';
import useVisibleDirections from '../vols/use-visible-directions';

import styles from './group-badge-list.module.css';

export const GroupBadgeList: FC = () => {
    const [page, setPage] = useState<number>(parseFloat(localStorage.getItem('volPageIndex') || '') || 1);
    const [pageSize, setPageSize] = useState<number>(parseFloat(localStorage.getItem('volPageSize') || '') || 10);

    const visibleDirections = useVisibleDirections();
    const { isMobile } = useMedia();
    const { edit } = useNavigation();
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        config: {
            pagination: {
                current: isMobile ? 1 : page,
                pageSize: isMobile ? 10000 : pageSize
            }
        }
    });

    const pagination: TablePaginationConfig = {
        total: groupBadges?.total ?? 1,
        showTotal: (total) => `Кол-во групповых бейджей: ${total}`,
        current: page,
        pageSize: pageSize,
        onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
            localStorage.setItem('volPageIndex', page.toString());
            localStorage.setItem('volPageSize', pageSize.toString());
        }
    };

    const data =
        groupBadges?.data.filter((item) => {
            return !visibleDirections || (item.direction && visibleDirections.includes(item.direction.id));
        }) ?? [];

    return (
        <List>
            {isMobile ? (
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
