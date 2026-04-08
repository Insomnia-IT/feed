import { useState, type FC } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Col, DatePicker, Input, Row, Select, Switch, Typography } from 'antd';
import dayjs from 'dayjs';

import { FilterFieldType } from './filter-types';
import type { FilterField, FilterItem, FilterListItem } from './filter-types';
import { getFilterListItems } from './get-filter-list-items';
import styles from '../../list.module.css';

const fieldStyle = {
    minWidth: '110px',
    gap: '4px'
};

export const FilterItemControl: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    isMobile?: boolean;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
}> = ({ field, filterItem, isMobile, onFilterTextValueChange, onFilterValueChange }) => {
    if (field.type === FilterFieldType.Lookup || field.type === FilterFieldType.Boolean) {
        return (
            <FilterSelect
                field={field}
                isMultiple={field.type === FilterFieldType.Lookup}
                filterItem={filterItem}
                isMobile={isMobile}
                onFilterTextValueChange={onFilterTextValueChange}
                onFilterValueChange={onFilterValueChange}
            />
        );
    }

    if (field.type === FilterFieldType.Date) {
        return (
            <DateField
                field={field}
                filterItem={filterItem}
                isMobile={isMobile}
                onFilterTextValueChange={onFilterTextValueChange}
            />
        );
    }

    return (
        <FilterInput
            field={field}
            filterItem={filterItem}
            isMobile={isMobile}
            onFilterTextValueChange={onFilterTextValueChange}
        />
    );
};

const SEPARATOR = ':';

const DateField: FC<{
    field: FilterField;
    filterItem?: FilterItem;
    isMobile?: boolean;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
}> = ({ field, filterItem, isMobile, onFilterTextValueChange }) => {
    const [isCalPopOpen, setIsCalPopOpen] = useState<boolean | undefined>(undefined);

    const [beforeString, afterString] = ((filterItem?.value as string | undefined) ?? '')?.split(SEPARATOR) ?? [];
    const [showPeriod, setShowPeriod] = useState(!!afterString);

    const changeValue = (value: string) => onFilterTextValueChange(field.name, value);

    return (
        <Col style={fieldStyle} className={isMobile ? styles.mobileFilterField : undefined}>
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
                                    <Typography.Text>Искать в диапазоне дат</Typography.Text>
                                    <Switch
                                        size={'small'}
                                        value={showPeriod}
                                        onChange={() => {
                                            setShowPeriod((prev) => !prev);
                                        }}
                                    />
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
                        placeholder="Выбери дату"
                        panelRender={(panel) => (
                            <>
                                <Row style={{ justifyContent: 'flex-start', gap: '8px', padding: '8px' }}>
                                    <Typography.Text>Искать в диапазоне дат</Typography.Text>
                                    <Switch
                                        size={'small'}
                                        value={showPeriod}
                                        onChange={() => {
                                            setShowPeriod((prev) => !prev);
                                        }}
                                    />
                                </Row>
                                {panel}
                            </>
                        )}
                        value={beforeString ? dayjs(beforeString) : undefined}
                        style={{ width: 300, display: !showPeriod ? undefined : 'none' }}
                        onChange={(value) => {
                            changeValue(value?.format('YYYY-MM-DD') ?? '');
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
    isMobile?: boolean;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
}> = ({ field, filterItem, isMobile, onFilterTextValueChange }) => {
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <Col style={fieldStyle} className={isMobile ? styles.mobileFilterField : undefined}>
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
    isMobile?: boolean;
    onFilterValueChange: (fieldName: string, filterListItem: FilterListItem, single?: boolean) => void;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
}> = ({ field, isMultiple, filterItem, isMobile, onFilterValueChange, onFilterTextValueChange }) => {
    const values = getFilterListItems(field, filterItem);

    const onSelect = (_value: string, option: FilterListItem) =>
        onFilterValueChange(field.name, { ...option, selected: false }, field.single);
    const onDeselect = (_value: string, option: FilterListItem) =>
        onFilterValueChange(field.name, { ...option, selected: true }, field.single);
    const onClear = () => onFilterTextValueChange(field.name);

    return (
        <Col style={fieldStyle} className={isMobile ? styles.mobileFilterField : undefined}>
            <Row>
                <Typography.Text type={'secondary'}>{field.title}</Typography.Text>
            </Row>
            <Row>
                <Select
                    className={styles.filterValueSelect}
                    style={{ width: '100%' }}
                    maxTagCount={1}
                    value={(filterItem?.value ?? []) as string[]}
                    onSelect={onSelect}
                    onDeselect={onDeselect}
                    onClear={onClear}
                    options={values}
                    placeholder={'Выбери из списка'}
                    optionFilterProp={'label'}
                    mode={isMultiple ? 'multiple' : undefined}
                    showSearch
                    allowClear={false}
                    suffixIcon={<DownOutlined />}
                />
            </Row>
        </Col>
    );
};
