import { DeleteButton, EditButton, List, Space, Table, TextField, Tooltip } from '@pankod/refine-antd';
import { useList, useNavigation } from '@pankod/refine-core';
import type { FC, ReactNode } from 'react';

import type { GroupBadgeEntity } from '~/interfaces';
import { useMedia } from '~/shared/providers';
import { getSorter } from '~/utils';
import useVisibleDirections from '../vols/use-visible-directions';

import styles from './group-badge-list.module.css';

export const GroupBadgeList: FC = () => {
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges'
    });

    const visibleDirections = useVisibleDirections();
    const { isMobile } = useMedia();
    const { edit } = useNavigation();

    const data =
        groupBadges?.data.filter((item) => {
            return !visibleDirections || (item.direction && visibleDirections.includes(item.direction.id));
        }) ?? [];

    return (
        <List>
            {isMobile ? (
                <div className={styles.mobileList}>
                    {data.map((badge) => (
                        <div key={badge.id} className={styles.card} onClick={() => edit('group-badges', badge.id)}>
                            <div className={styles.header}>
                                <Tooltip title={badge.name}>
                                    <span className={styles.name}>{badge.name}</span>
                                </Tooltip>
                                <Space>
                                    <DeleteButton hideText size='small' recordItemId={badge.id} />
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
                <Table dataSource={data} rowKey='id' pagination={false}>
                    <Table.Column<GroupBadgeEntity>
                        title=''
                        dataIndex='actions'
                        render={(_, record) => (
                            <Space>
                                <EditButton hideText size='small' recordItemId={record.id} />
                                <DeleteButton hideText size='small' recordItemId={record.id} />
                            </Space>
                        )}
                    />
                    <Table.Column
                        dataIndex='name'
                        key='name'
                        title='Название'
                        render={(value: string): ReactNode => (
                            <Tooltip title={value}>
                                <TextField value={value} />
                            </Tooltip>
                        )}
                        sorter={getSorter('name')}
                        ellipsis
                    />
                    <Table.Column
                        dataIndex={['direction', 'name']}
                        key='direction'
                        title='Служба/Направление'
                        render={(value: string): ReactNode => (
                            <Tooltip title={value}>
                                <TextField value={value} />
                            </Tooltip>
                        )}
                        ellipsis
                    />
                    <Table.Column
                        dataIndex='volunteer_count'
                        key='volunteer_count'
                        title='Количество волонтеров'
                        ellipsis
                    />
                    <Table.Column
                        dataIndex='comment'
                        key='comment'
                        title='Комментарий'
                        render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                        ellipsis
                    />
                </Table>
            )}
        </List>
    );
};
