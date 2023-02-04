import {
    DateField,
    DeleteButton,
    EditButton,
    FilterDropdown,
    getDefaultSortOrder,
    List,
    Space,
    Table,
    TextField,
    useSelect,
    useTable
} from '@pankod/refine-antd';
import type { DepartmentEntity } from '@feed/api/src/entities/department.entity';
import type { IResourceComponentsProps } from '@pankod/refine-core';
// import { Loader } from '@feed/ui/src/loader';
import { ListBooleanNegative, ListBooleanPositive } from '@feed/ui/src/icons'; // TODO exclude src
import Select from 'rc-select';

import type { VolEntity } from '~/interfaces';

export const VolList: FC<IResourceComponentsProps> = () => {
    const { sorter, tableProps } = useTable<VolEntity>({
        initialSorter: [
            {
                field: 'id',
                order: 'desc'
            }
        ]
    });

    const { selectProps } = useSelect<VolEntity>({
        resource: 'vols'
    });

    // return <Loader />;
    console.log(tableProps);
    return (
        <List>
            <Table {...tableProps} rowKey='id'>
                <Table.Column
                    dataIndex={['department', 'name']}
                    title='Department'
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Select
                                style={{ minWidth: 200 }}
                                mode='multiple'
                                placeholder='Department'
                                {...selectProps}
                            />
                        </FilterDropdown>
                    )}
                />
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                    defaultSortOrder={getDefaultSortOrder('name', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex='activeFrom'
                    key='activeFrom'
                    title='От'
                    render={(value) => <DateField value={value} />}
                    defaultSortOrder={getDefaultSortOrder('activeFrom', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex='activeTo'
                    key='activeTo'
                    title='До'
                    render={(value) => <DateField value={value} />}
                    defaultSortOrder={getDefaultSortOrder('activeTo', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex='isActive'
                    key='isActive'
                    title='Активирован'
                    render={(value) => <ListBooleanPositive value={value} />}
                    defaultSortOrder={getDefaultSortOrder('isActive', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex='isBlocked'
                    key='isBlocked'
                    title='Блокирован'
                    render={(value) => <ListBooleanNegative value={value} />}
                    defaultSortOrder={getDefaultSortOrder('isBlocked', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex='comment'
                    key='comment'
                    title='Комментарий'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column<DepartmentEntity>
                    title='Действия'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
