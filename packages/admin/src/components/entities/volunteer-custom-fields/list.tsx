import { FC } from 'react';
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

import type { VolunteerCustomFieldEntity } from 'interfaces';
import { getSorter } from 'utils';

export const VolunteerCustomFieldList: FC<IResourceComponentsProps> = () => {
    const { sorter, tableProps } = useTable<VolunteerCustomFieldEntity>({
        initialSorter: [
            {
                field: 'id',
                order: 'asc'
            }
        ],
        initialPageSize: 1000,
        hasPagination: false
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="name"
                    key="name"
                    title="Название"
                    defaultSortOrder={getDefaultSortOrder('name', sorter)}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex="type"
                    key="type"
                    title="Тип данных"
                    defaultSortOrder={getDefaultSortOrder('type', sorter)}
                    sorter={getSorter('type')}
                />
                <Table.Column
                    dataIndex="comment"
                    key="comment"
                    title="Комментарий"
                    render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                />
                <Table.Column
                    dataIndex="mobile"
                    key="mobile"
                    sorter={getSorter('mobile')}
                    title="Отображать в мобильной админке"
                    render={(value) => <p> {value ? 'Да' : 'Нет'}</p>}
                />
                <Table.Column<VolunteerCustomFieldEntity>
                    title="Действия"
                    dataIndex="actions"
                    width="150px"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
