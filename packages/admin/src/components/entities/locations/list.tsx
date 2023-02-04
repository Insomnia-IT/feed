import {
    DeleteButton,
    EditButton,
    FilterDropdown,
    getDefaultSortOrder,
    List,
    Space,
    Table,
    useSelect,
    useTable
} from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';
import Select from 'rc-select';

import type { DepartmentEntity, LocationEntity } from '~/interfaces';

const selectStyle = { minWidth: 200 };

export const LocationList: FC<IResourceComponentsProps> = () => {
    const { sorter, tableProps } = useTable<DepartmentEntity>({
        initialSorter: [
            {
                field: 'id',
                order: 'desc'
            }
        ]
    });

    const { selectProps: leadSelectProps } = useSelect<LocationEntity>({
        resource: 'locations'
    });

    return (
        <List>
            <Table {...tableProps} rowKey='id'>
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Name'
                    render={renderText}
                    defaultSortOrder={getDefaultSortOrder('name', sorter)}
                    sorter
                />
                <Table.Column
                    dataIndex={['lead', 'name']}
                    title='Lead'
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Select style={selectStyle} mode='multiple' placeholder='Lead' {...leadSelectProps} />
                        </FilterDropdown>
                    )}
                />
                <Table.Column<DepartmentEntity>
                    title='Actions'
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
