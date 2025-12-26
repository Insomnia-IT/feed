import { FC, useState } from 'react';
import { Col, DatePicker, Input, Row, Select, Typography, Switch } from 'antd';
import { FilterField, FilterFieldType, FilterItem, FilterListItem } from './filter-types';

import { getFilterListItems } from './get-filter-list-items';
import dayjs from 'dayjs';

const fieldStyle = {
    minWidth: '110px',
    gap: '4px'
};

export const FilterItemControl: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterTextValueChange, onFilterValueChange }) => {
    if (field.type === FilterFieldType.Lookup || field.type === FilterFieldType.Boolean) {
        return (
            <FilterSelect
                field={field}
                isMultiple={field.type === FilterFieldType.Lookup}
                filterItem={filterItem}
                onFilterTextValueChange={onFilterTextValueChange}
                onFilterValueChange={onFilterValueChange}
            />
        );
    }

    if (field.type === FilterFieldType.Date) {
        return <DateField field={field} filterItem={filterItem} onFilterTextValueChange={onFilterTextValueChange} />;
    }

    return (
        <FilterInput
            field={field}
            filterItem={filterItem}
            onFilterTextValueChange={onFilterTextValueChange}
            onFilterValueChange={onFilterValueChange}
        />
    );
};

const SEPARATOR = ':';

const DateField: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
}> = ({ field, filterItem, onFilterTextValueChange }) => {
    const [isCalPopOpen, setIsCalPopOpen] = useState<boolean | undefined>(undefined);

    const [beforeString, afterString] = ((filterItem?.value as string | undefined) ?? '')?.split(SEPARATOR) ?? [];

    const [showPeriod, setShowPeriod] = useState(!!afterString);

    // Ожидаем значение в формате YYYY-MM-DD:YYYY-MM-DD
    const changeValue = (value: string) => onFilterTextValueChange(field.name, value);

    return (
        <Col style={fieldStyle}>
            <Row style={{ justifyContent: 'space-between' }}>
                <Typography.Text type={'secondary'}>{field.title}</Typography.Text>
            </Row>
            <Row>
                {showPeriod ? (
                    <DatePicker.RangePicker
                        open={isCalPopOpen}
                        onOpenChange={(value) => setIsCalPopOpen(value)}
                        placeholder={['пусто', 'пусто']}
                        panelRender={(panel) => (
                            <>
                                <Row style={{ justifyContent: 'flex-start', padding: '8px', gap: '8px', width: '50%' }}>
                                    <Col>
                                        <Typography.Text>Искать в диапазоне дат</Typography.Text>
                                    </Col>
                                    <Col>
                                        <Switch
                                            size={'small'}
                                            value={showPeriod}
                                            onChange={() => {
                                                setShowPeriod((prev) => !prev);
                                            }}
                                        />
                                    </Col>
                                </Row>
                                {panel}
                            </>
                        )}
                        allowEmpty={[true, true]}
                        style={{ width: 300, display: showPeriod ? undefined : 'none' }}
                        value={[
                            beforeString ? dayjs(beforeString) : undefined,
                            afterString ? dayjs(afterString) : undefined
                        ]}
                        onChange={(value) => {
                            // Сохраняем значение в формате YYYY-MM-DD:YYYY-MM-DD
                            const periodString = (value ?? [])
                                .filter((e) => !!e)
                                .map((date) => date?.format('YYYY-MM-DD'))
                                .join(SEPARATOR);

                            changeValue(periodString);
                        }}
                    />
                ) : (
                    <DatePicker
                        open={isCalPopOpen}
                        onOpenChange={(value) => setIsCalPopOpen(value)}
                        panelRender={(panel) => (
                            <>
                                <Row style={{ justifyContent: 'flex-start', gap: '8px', padding: '8px' }}>
                                    <Col>
                                        <Typography.Text>Искать в диапазоне дат</Typography.Text>
                                    </Col>
                                    <Col>
                                        <Switch
                                            size={'small'}
                                            value={showPeriod}
                                            onChange={() => {
                                                setShowPeriod((prev) => !prev);
                                            }}
                                        />
                                    </Col>
                                </Row>
                                {panel}
                            </>
                        )}
                        value={beforeString ? dayjs(beforeString) : undefined}
                        style={{ width: 300, display: !showPeriod ? undefined : 'none' }}
                        onChange={(value) => {
                            // Сохраняем значение в формате YYYY-MM-DD
                            const periodString = value?.format('YYYY-MM-DD');

                            changeValue(periodString);
                        }}
                    />
                )}
            </Row>
        </Col>
    );
};

const FilterInput: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, onFilterTextValueChange }) => {
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <Col style={fieldStyle}>
            <Row>
                <Typography.Text type={'secondary'}>{field.title}</Typography.Text>
            </Row>

            <Row>
                <Input
                    style={fieldStyle}
                    value={filterItem?.value as string | undefined}
                    onChange={(e) => onFilterTextValueChange(field.name, e.target.value)}
                    placeholder={'Введи текст'}
                    onClear={onClear}
                    allowClear
                />
            </Row>
        </Col>
    );
};

const FilterSelect: FC<{
    field: FilterField;
    isMultiple?: boolean;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, isMultiple, filterItem, onFilterValueChange, onFilterTextValueChange }) => {
    const values = getFilterListItems(field, filterItem);

    const onChange = (_id: string, value: FilterListItem) => onFilterValueChange(field.name, value, field.single);
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <Col style={fieldStyle}>
            <Row>
                <Typography.Text type={'secondary'}>{field.title}</Typography.Text>
            </Row>

            <Row>
                <Select
                    style={{ width: '100%' }}
                    maxTagCount={1}
                    value={(filterItem?.value ?? []) as string[]}
                    onSelect={onChange}
                    onDeselect={onChange}
                    onClear={onClear}
                    options={values}
                    placeholder={'Выбери из списка'}
                    optionFilterProp={'label'}
                    mode={isMultiple ? 'multiple' : undefined}
                    showSearch
                    allowClear
                />
            </Row>
        </Col>
    );
};
