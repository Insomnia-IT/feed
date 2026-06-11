import { Col, Row, Popover, Button, Checkbox } from 'antd';
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons';
import { useContext } from 'react';

import { ActiveColumnsContext } from 'components/entities/vols/vol-list/active-columns-context';
import { useNavigation } from '@refinedev/core';
import { EditButton } from '@refinedev/antd';

export const ChooseColumnsButton = ({ canListCustomFields }: { canListCustomFields: boolean }) => {
    const { activeColumns = [], allColumns = [], toggleOne } = useContext(ActiveColumnsContext) ?? {};

    const { create } = useNavigation();

    const handleClickCustomFields = (): void => {
        create('volunteer-custom-fields');
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
                            {!field.isCustom || !field?.customFieldId ? null : (
                                <EditButton
                                    resource={'volunteer-custom-fields'}
                                    recordItemId={field.customFieldId}
                                    disabled={!canListCustomFields}
                                    hideText
                                    size="small"
                                />
                            )}
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
