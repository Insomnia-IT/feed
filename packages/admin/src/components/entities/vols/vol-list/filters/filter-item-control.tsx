import { FC } from 'react';
import { Col, Input, Row, Select, Typography } from 'antd';
import { FilterField, FilterFieldType, FilterItem, FilterListItem } from './filter-types';

import { getFilterListItems } from './get-filter-list-items';
import AdaptiveDatePicker from 'components/controls/adaptiveDatePicker/adaptive-date-picker';

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

const DateField: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
}> = ({ field, filterItem, onFilterTextValueChange }) => {
    const value = filterItem?.value as string | undefined;

    // Ожидаем значение в формате YYYY-MM-DD:YYYY-MM-DD
    const changeValue = (value: string | undefined | null) => onFilterTextValueChange(field.name, value ?? undefined);

    return (
        <Col style={fieldStyle}>
            <Row style={{ justifyContent: 'space-between' }}>
                <Typography.Text type={'secondary'}>{field.title}</Typography.Text>
            </Row>
            <Row>
                <AdaptiveDatePicker
                    value={value}
                    onChange={(value) => {
                        changeValue(value);
                    }}
                />
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
