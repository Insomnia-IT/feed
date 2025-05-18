import { List, useTable } from '@refinedev/antd';
import { Button, Col, Row, Table, Tag } from 'antd';
import { WashEntity } from 'interfaces';
import { useNavigate } from 'react-router-dom';
import { transformWashesForShow, WashToShow } from './utils.ts';
import { SaveWashesAsExcelButton } from './save-washes-as-excel-button.tsx';
import { ExperimentOutlined } from '@ant-design/icons/lib/icons';

export const WashesHistory = () => {
    const navigate = useNavigate();
    const { tableProps } = useTable<WashEntity>({ resource: 'washes' });

    const columns = [
        {
            title: 'Имя волонтера',
            dataIndex: 'volunteerName'
        },
        { title: 'Полное имя', dataIndex: 'volunteerFullName' },
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
        { title: 'Дата стирки', dataIndex: 'washDate' },
        { title: 'Дата стирки', dataIndex: 'washDate' },
        { title: 'Имя совы', dataIndex: 'owlName' }
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
                pagination={tableProps.pagination}
                dataSource={tableProps.dataSource?.map(transformWashesForShow) ?? []}
                columns={columns}
                rowKey="id"
            />
        </List>
    );
};
