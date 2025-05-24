import { CreateButton, useTable } from '@refinedev/antd';
import { Space, Table } from 'antd';
import type { TableProps } from 'antd';
import type { PersonEntity } from 'interfaces';
import { useNavigate } from 'react-router-dom';

export const PersonsTable = ({ searchText }: { searchText: string }) => {
    const { tableProps } = useTable<PersonEntity>({
        resource: `persons/?search=${searchText}`,
        pagination: {
            // pageSize: 0
        }
    });

    const navigate = useNavigate();

    const columns: TableProps<PersonEntity>['columns'] = [
        {
            dataIndex: 'name',
            key: 'name',
            title: 'Позывной'
        },
        {
            dataIndex: 'first_name',
            key: 'first_name',
            title: 'Имя'
        },
        {
            dataIndex: 'last_name',
            key: 'last_name',
            title: 'Фамилия'
        },
        {
            dataIndex: 'nickname',
            key: 'nickname',
            title: 'Ник'
        },
        {
            dataIndex: 'other_names',
            key: 'other_names',
            title: 'Другие имена'
        },
        {
            dataIndex: 'actions',
            key: 'actions',
            title: '',
            width: 100,
            render: (_, record) => (
                <Space>
                    <CreateButton
                        resource="volunteers"
                        onClick={() => {
                            navigate('/volunteers/create?person_id=' + record.id);
                        }}
                    />
                </Space>
            )
        }
    ];

    return <Table<PersonEntity> {...tableProps} scroll={{ x: '100%' }} rowKey="id" columns={columns} />;
};
