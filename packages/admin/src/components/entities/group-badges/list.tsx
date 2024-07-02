import {
    DeleteButton,
    EditButton,
    getDefaultSortOrder,
    List,
    ShowButton,
    Space,
    Table,
    useTable
} from '@pankod/refine-antd';
import { type IResourceComponentsProps, useList } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';

import type { GroupBadgeEntity } from '~/interfaces';
import { useMedia } from '~/shared/providers';
import { getSorter } from '~/utils';

import useVisibleDirections from '../vols/use-visible-directions';

export const GroupBadgeList: FC<IResourceComponentsProps> = () => {
    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    const visibleDirections = useVisibleDirections();

    const data = groupBadges?.data.filter((item) => {
        return !visibleDirections || (item.direction && visibleDirections.includes(item.direction.id));
    });

    const { isDesktop } = useMedia();

    return (
        <List>
            <Table dataSource={data} rowKey='id' scroll={{ x: '100%' }}>
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
