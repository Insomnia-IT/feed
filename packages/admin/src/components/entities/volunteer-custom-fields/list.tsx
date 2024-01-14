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
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';

import type { VolunteerCustomFieldEntity } from '~/interfaces';

export const VolunteerCustomFieldList: FC<IResourceComponentsProps> = () => {
    const { sorter, tableProps } = useTable<VolunteerCustomFieldEntity>({
        initialSorter: [
            {
                field: 'id',
                order: 'asc'
            }
        ]
    });

    return (
        <List>
            <Table {...tableProps} rowKey='id'>
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Название'
                    render={renderText}
                    defaultSortOrder={getDefaultSortOrder('name', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex='comment'
                    key='comment'
                    title='Комментарий'
                    render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                />
                <Table.Column<VolunteerCustomFieldEntity>
                    title='Действия'
                    dataIndex='actions'
                    width='150px'
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
