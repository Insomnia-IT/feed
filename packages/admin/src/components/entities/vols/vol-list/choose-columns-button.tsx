import { Col, Row, Popover, Button, Checkbox } from 'antd';
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons';
import { FC, useContext } from 'react';

import { CustomFieldEntity } from 'interfaces';
import { ActiveColumnsContext } from 'components/entities/vols/vol-list/active-columns-context';

export const ChooseColumnsButton: FC<{
    canListCustomFields: boolean;
    customFields: Array<CustomFieldEntity>;
}> = ({ canListCustomFields }) => {
    const { activeColumns = [], allColumns = [], toggleOne } = useContext(ActiveColumnsContext) ?? {};

    // TODO: вместо страницы должна быть модалка
    const handleClickCustomFields = (): void => {
        window.location.href = `${window.location.origin}/volunteer-custom-fields`;
    };

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            arrow={false}
            content={
                <Col>
                    {allColumns.map((field) => (
                        <Row key={field.fieldName} style={{ padding: '5px 0' }}>
                            <Checkbox
                                checked={activeColumns.includes(field.fieldName)}
                                onClick={() => {
                                    if (toggleOne) {
                                        toggleOne(field.fieldName);
                                    }
                                }}
                            >
                                {field.title}
                            </Checkbox>
                        </Row>
                    ))}
                    <Row style={{ paddingTop: '8px' }}>
                        <Button
                            disabled={!canListCustomFields}
                            onClick={handleClickCustomFields}
                            type={'primary'}
                            icon={<PlusOutlined />}
                        >
                            Добавить колонку
                        </Button>
                    </Row>
                </Col>
            }
        >
            <Button icon={<DatabaseOutlined />}>Колонки</Button>
        </Popover>
    );
};
