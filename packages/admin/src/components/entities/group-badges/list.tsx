import { DeleteButton, EditButton, List, Space, Table, TextField } from '@pankod/refine-antd';
import { type IResourceComponentsProps, useList } from '@pankod/refine-core';
import { Tooltip } from 'antd';

import type { GroupBadgeEntity } from '~/interfaces';
import { useMedia } from '~/shared/providers';
import { getSorter } from '~/utils';

import useVisibleDirections from '../vols/use-visible-directions';

export const GroupBadgeList: FC<IResourceComponentsProps> = () => {
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges'
    });

    const visibleDirections = useVisibleDirections();

    const data =
        groupBadges?.data.filter((item) => {
            return !visibleDirections || (item.direction && visibleDirections.includes(item.direction.id));
        }) ?? [];

    const { isDesktop } = useMedia();

    return (
        <List>
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
                    render={(value: string): ReactNode => <TextField value={value} />}
                    ellipsis
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
