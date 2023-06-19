import {
    DeleteButton,
    EditButton,
    FilterDropdown,
    List,
    Select,
    Space,
    Table,
    TextField,
    useSelect
} from '@pankod/refine-antd';
import { useMemo } from 'react';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList, useMany } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';

import type { DepartmentEntity, VolEntity } from '~/interfaces';

type Lead = Pick<VolEntity, 'id' | 'nickname'>;

const selectStyle = { minWidth: 200 };

export const DepartmentList: FC<IResourceComponentsProps> = () => {
    const { data: departments } = useList<DepartmentEntity>({
        resource: 'departments',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    const leadIds = useMemo(
        () => departments?.data?.filter((d) => Number.isInteger(d.lead)).map((d) => d.lead!.toString()) || [],
        [departments]
    );

    const { data: leads } = useMany<Lead>({
        resource: 'volunteers',
        ids: leadIds,
        queryOptions: {
            enabled: leadIds.length > 0
        }
    });

    const { selectProps: leadSelectProps } = useSelect<Lead>({
        resource: 'volunteers',
        optionLabel: 'nickname'
    });

    const filteredSource = useMemo(
        () =>
            departments?.data.map((d) => ({
                ...(d as Omit<DepartmentEntity, 'lead'>),
                lead: leads?.data?.find((v) => v.id === d.lead) ?? null
            })),
        [departments, leads]
    );

    return (
        <List>
            <Table rowKey='id' dataSource={filteredSource}>
                <Table.Column dataIndex='name' title='Название' render={renderText} sorter />
                <Table.Column<{ lead: Lead | null }>
                    dataIndex={['lead', 'nickname']}
                    title='Руководитель'
                    render={(value) => <TextField value={value} />}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Select
                                style={selectStyle}
                                mode='multiple'
                                placeholder='Руководитель'
                                {...leadSelectProps}
                            />
                        </FilterDropdown>
                    )}
                    onFilter={(value, record) => value === record.lead?.id}
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
