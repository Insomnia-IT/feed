import { List, useTable } from '@refinedev/antd';
import { Button, Col, Row, Table, Tag } from 'antd';
import { WashEntity } from 'interfaces';
import { useNavigate } from 'react-router-dom';
import { transformWashesForShow, WashToShow } from './utils';
import { SaveWashesAsExcelButton } from './save-washes-as-excel-button';
import { ExperimentOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

export const WashesHistory = () => {
    const navigate = useNavigate();
    const { tableProps, setCurrent, setPageSize } = useTable<WashEntity>({ resource: 'washes' });

    const columns = [
        {
            title: 'Позывной',
            dataIndex: 'volunteerName'
        },
        { title: 'ФИО', dataIndex: 'volunteerFullName' },
        {
            dataIndex: 'directions',
            title: 'Службы',
            render: (value: string[]) => {
                return value.map((name) => (
                    <Tag key={name} color={'default'} icon={false} closable={false}>
                        {name}
                    </Tag>
                ));
            }
        },
        { title: 'Дней на поле', dataIndex: 'daysOnField' },
        {
            title: 'Дата стирки',
            dataIndex: 'washDate',
            render: (washDate: Dayjs) => washDate.format('DD/MM/YY HH:mm:ss')
        },
        {
            title: 'Номер стирки',
            dataIndex: 'washCount'
        },
        { title: 'Позывной совы', dataIndex: 'owlName' }
    ];

    return (
        <List>
            <Row>
                <Col style={{ width: '50%' }}>
                    <Button
                        type={'primary'}
                        icon={<ExperimentOutlined />}
                        onClick={() => {
                            navigate('/wash/create');
                        }}
                    >
                        Постирать
                    </Button>
                </Col>
                <Col style={{ width: '50%', display: 'flex' }}>
                    <SaveWashesAsExcelButton />
                </Col>
            </Row>
            <Table<WashToShow>
                pagination={{
                    ...tableProps.pagination,
                    onChange: (page, size) => {
                        setCurrent(page);

                        if (typeof size === 'number') {
                            setPageSize(size);
                        }
                    }
                }}
                dataSource={tableProps.dataSource?.map(transformWashesForShow) ?? []}
                columns={columns}
                rowKey="id"
            />
        </List>
    );
};
