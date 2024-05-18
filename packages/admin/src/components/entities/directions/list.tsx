import {
    DeleteButton,
    EditButton,
    ShowButton,
    List,
    Space,
    Table,
} from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';

import type { DirectionEntity } from '~/interfaces';

export const DepartmentList: FC<IResourceComponentsProps> = () => {
    const { data: directions } = useList<DirectionEntity>({
        resource: 'directions',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    return (
        <List>
            <Table pagination={false} rowKey='id' dataSource={directions?.data}>
                <Table.Column dataIndex='name' title='Название' render={renderText} sorter />
                <Table.Column
                    dataIndex={['type', 'name']}
                    title='Тип'
                    render={renderText}
                />
                <Table.Column<DirectionEntity>
                    title='Действия'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size='small' recordItemId={record.id} />
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
