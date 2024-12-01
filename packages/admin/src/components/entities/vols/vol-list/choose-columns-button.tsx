import { Col, Row, Popover, Button, Checkbox } from '@pankod/refine-antd';
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons';
import { CustomFieldEntity } from '~/interfaces';
import { useContext } from 'react';
import { ActiveColumnsContext } from '~/components/entities/vols/vol-list/active-columns-context';

export const ChooseColumnsButton: FC<{ canListCustomFields: boolean; customFields: Array<CustomFieldEntity> }> = ({
    canListCustomFields
}) => {
    const { activeColumns = [], allColumns = [], toggleAll, toggleOne } = useContext(ActiveColumnsContext) ?? {};

    // TODO: вместо страницы должна быть модалка
    const handleClickCustomFields = (): void => {
        window.location.href = `${window.location.origin}/volunteer-custom-fields`;
    };
    const indeterminate = activeColumns.length > 0 && activeColumns.length < allColumns.length;

    const isAllChecked = activeColumns.length === allColumns.length;

    return (
        <Popover
            trigger='click'
            placement='bottomLeft'
            arrow={false}
            content={
                <Col>
                    <Row>
                        <Checkbox indeterminate={indeterminate} onClick={toggleAll} checked={isAllChecked}>
                            Выбрать все
                        </Checkbox>
                    </Row>
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
