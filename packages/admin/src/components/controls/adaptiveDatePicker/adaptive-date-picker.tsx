import { useScreen } from '../../../shared/providers';
import { DatePicker, Input, Row, Switch, Typography } from 'antd';
import { CalendarPicker } from 'antd-mobile';
import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';

const SEPARATOR = ':';

interface AdaptiveDatePickerProps {
    value?: string | null;
    onChange: (dateString?: string | null) => void;
    variant?: 'single' | 'range';
}

interface DesktopDatePickerProps {
    useRange: boolean;
    setUseRange: (value: boolean) => void;
    value?: string | null;
    onChange: (dateString?: string) => void;
}

interface MobileDatePickerProps {
    value?: string | null;
    inputStyle?: React.CSSProperties;
    onChange?: (date?: string | null) => void;
    useRange: boolean;
    setUseRange: (value: boolean) => void;
}

const parseDateValue = (value: string | null | undefined): [string, string] => {
    const parts = (value ?? '').split(SEPARATOR);
    return [parts[0] ?? '', parts[1] ?? ''];
};

const formatDateRange = (dates: (dayjs.Dayjs | null | undefined)[]): string => {
    return dates
        .filter((e) => !!e)
        .map((date) => date?.format('YYYY-MM-DD'))
        .join(SEPARATOR);
};

const PANEL_STYLE: React.CSSProperties = {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '8px'
};

const AdaptiveDatePicker = ({ value, onChange, variant }: AdaptiveDatePickerProps) => {
    const { isMobile = true } = useScreen();

    const [, afterString] = useMemo(() => parseDateValue(value), [value]);

    const [useRange, setUseRange] = useState(variant ? variant === 'range' : !!afterString);

    if (isMobile) {
        return <MobileDatePicker useRange={useRange} setUseRange={setUseRange} value={value} onChange={onChange} />;
    }

    return <DesktopDatePicker useRange={useRange} setUseRange={setUseRange} value={value} onChange={onChange} />;
};

const DesktopDatePicker = ({ value, onChange, useRange, setUseRange }: DesktopDatePickerProps) => {
    const [isCalPopOpen, setIsCalPopOpen] = useState<boolean | undefined>(undefined);
    const [beforeString, afterString] = useMemo(() => parseDateValue(value), [value]);

    const panelRender = (panel: React.ReactNode) => (
        <>
            <Row style={{ ...PANEL_STYLE, width: useRange ? '50%' : undefined }}>
                <Typography.Text>Искать в диапазоне дат</Typography.Text>
                <Switch
                    size={'small'}
                    value={useRange}
                    onChange={() => {
                        setUseRange(!useRange);
                    }}
                />
            </Row>
            {panel}
        </>
    );

    if (useRange) {
        return (
            <DatePicker.RangePicker
                open={isCalPopOpen}
                onOpenChange={(value) => setIsCalPopOpen(value)}
                placeholder={['пусто', 'пусто']}
                panelRender={panelRender}
                format={{ format: 'DD.MM.YYYY' }}
                allowEmpty={[true, true]}
                style={{ width: 300, display: useRange ? undefined : 'none' }}
                value={[beforeString ? dayjs(beforeString) : undefined, afterString ? dayjs(afterString) : undefined]}
                onChange={(value) => {
                    const periodString = formatDateRange(value ?? []);
                    onChange(periodString);
                }}
            />
        );
    }

    return (
        <DatePicker
            format={{ format: 'DD.MM.YYYY' }}
            onOpenChange={(value) => setIsCalPopOpen(value)}
            panelRender={panelRender}
            value={beforeString ? dayjs(beforeString) : undefined}
            open={isCalPopOpen}
            onChange={(value) => onChange(value?.format('YYYY-MM-DD'))}
        />
    );
};

const MobileDatePicker = ({ value, inputStyle, onChange, useRange, setUseRange }: MobileDatePickerProps) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [beforeString, afterString] = useMemo(() => parseDateValue(value), [value]);

    const getDefaultTempDate = (): Date | [Date, Date] | null => {
        if (!beforeString) {
            return null;
        }

        return useRange ? [dayjs(beforeString)?.toDate(), dayjs(afterString)?.toDate()] : dayjs(beforeString)?.toDate();
    };

    const [tempDate, setTempDate] = useState<Date | [Date, Date] | null>(getDefaultTempDate());

    const onChangeInner = (value: Date | [Date, Date] | null) => {
        if (!onChange) {
            return;
        }

        if (Array.isArray(value)) {
            onChange(value.map((valuePart) => dayjs(valuePart)?.format('YYYY-MM-DD')).join(SEPARATOR));
            return;
        }

        const dateJS = dayjs(value);
        onChange(dateJS?.format('YYYY-MM-DD'));
    };

    const getTextValue = (value: Date | [Date, Date] | null) => {
        if (!beforeString) {
            return '';
        }

        return Array.isArray(value)
            ? value.map((date) => dayjs(date).format('DD.MM.YYYY')).join(' - ')
            : dayjs(value)?.format('DD.MM.YYYY');
    };

    return (
        <>
            <Input
                placeholder="Выберите дату"
                value={getTextValue(tempDate)}
                style={inputStyle}
                onClick={() => setIsPopupOpen(true)}
                onClear={() => {
                    if (onChange) {
                        onChange(null);
                    }
                }}
                allowClear
                suffix={value ? null : <CalendarOutlined />}
            />
            {/* @ts-expect-error - selectionMode type narrowing issue */}
            <CalendarPicker
                weekStartsOn="Monday"
                title={
                    <div>
                        <span>Выбор даты</span>
                        <div>
                            Выбрать период{' '}
                            <Switch
                                size={'small'}
                                value={useRange}
                                onChange={() => {
                                    setUseRange(!useRange);
                                }}
                            />
                        </div>
                    </div>
                }
                selectionMode={useRange ? 'range' : 'single'}
                visible={isPopupOpen}
                value={tempDate ?? dayjs().toDate()}
                onClose={() => setIsPopupOpen(false)}
                onChange={setTempDate}
                onConfirm={onChangeInner}
                defaultValue={tempDate ?? dayjs().toDate()}
                min={(dayjs(beforeString).isValid() ? dayjs(beforeString) : dayjs()).subtract(1, 'year').toDate()}
                allowClear
            />
        </>
    );
};

export default AdaptiveDatePicker;
