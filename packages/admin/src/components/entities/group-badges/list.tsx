import { DeleteButton, EditButton, List, Space, Table } from '@pankod/refine-antd';
import { type IResourceComponentsProps, useList } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';

import type { GroupBadgeEntity, VolEntity } from '~/interfaces';
import { useMedia } from '~/shared/providers';
import { getSorter } from '~/utils';

import useVisibleDirections from '../vols/use-visible-directions';

export const GroupBadgeList: FC<IResourceComponentsProps> = () => {
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges'
    });

    const visibleDirections = useVisibleDirections();

    const data = groupBadges?.data.filter((item) => {
        return !visibleDirections || (item.direction && visibleDirections.includes(item.direction.id));
    });

    const badgesIds = data?.map((badge) => badge.id) ?? [];

    const volunteers = useList<VolEntity>({
        resource: 'volunteers',
        config: {
            pagination: {
                pageSize: 10000
            },
            filters: [
                {
                    field: 'group_badge',
                    operator: 'in',
                    value: badgesIds
                }
            ]
        }
    });

    const { isDesktop } = useMedia();

    return (
        <List>
            <Table dataSource={data} rowKey='id' scroll={{ x: '100%' }} pagination={false}>
                <Table.Column<GroupBadgeEntity>
                    title=''
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            {/* <ShowButton hideText size='small' recordItemId={record.id} /> */}
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Название'
                    render={renderText}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex={['direction', 'name']}
                    key='direction'
                    title='Служба/Направление'
                    render={renderText}
                />
                <Table.Column<GroupBadgeEntity>
                    dataIndex='amount'
                    key='amount'
                    title='Количество волонтеров'
                    render={(_value, record) => {
                        return (
                            volunteers?.data?.data?.filter((volunteer) => volunteer.group_badge === record.id)
                                ?.length ?? '-'
                        );
                    }}
                />
                {isDesktop && (
                    <Table.Column
                        dataIndex='comment'
                        key='comment'
                        title='Комментарий'
                        render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                    />
                )}
            </Table>
        </List>
    );
};
