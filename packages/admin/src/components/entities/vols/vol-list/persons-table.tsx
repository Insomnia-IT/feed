import { CreateButton } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Space, Table } from 'antd';
import type { TableProps } from 'antd';
import { useState } from 'react';
import type { PersonEntity } from 'interfaces';
import { useNavigate } from 'react-router';

export const PersonsTable = ({ searchText }: { searchText: string }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { result, query } = useList<PersonEntity>({
        resource: `persons/?search=${searchText}`,
        pagination: {
            mode: 'server',
            currentPage,
            pageSize
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

    return (
        <Table
            dataSource={result.data}
            loading={query.isLoading}
            pagination={{
                current: currentPage,
                pageSize,
                total: result.total,
                onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                }
            }}
            scroll={{ x: '100%' }}
            rowKey="id"
            columns={columns}
        />
    );
};
