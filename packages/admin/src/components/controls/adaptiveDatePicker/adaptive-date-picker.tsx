import { useScreen } from '../../../shared/providers';
import { DatePicker, Input, Row, Switch, Typography } from 'antd';
import { CalendarPicker } from 'antd-mobile';
import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';

// TODO: RANGE WORKING CORRECT

const AdaptiveDatePicker = ({
    value,
    onChange,
    variant
}: {
    /** Показывать чек-бокс выбора периода */
    showModeChanger?: boolean;
    variant?: 'single' | 'range';
    value?: string | null;
    onChange: ((dateString?: string | null) => void) | undefined;
}) => {
    const { isMobile = true } = useScreen();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_beforeString, afterString] = useMemo(() => (value ?? '')?.split(SEPARATOR) ?? [], [value]);

    const [useRange, setUseRange] = useState(variant ? variant === 'range' : !!afterString);

    if (isMobile) {
        return <MobileDatePicker useRange={useRange} setUseRange={setUseRange} value={value} onChange={onChange} />;
    }

    return <DesktopDatePicker useRange={useRange} setUseRange={setUseRange} value={value} onChange={onChange} />;
};

const SEPARATOR = ':';

const DesktopDatePicker = ({
    value,
    onChange,
    useRange,
    setUseRange
}: {
    open?: boolean;
    /** Показывать чек-бокс выбора периода */
    showModeChanger?: boolean;
    useRange: boolean;
    setUseRange: (value: boolean) => void;
    value?: string | null;
    onChange: ((dateString?: string) => void) | undefined;
}) => {
    const [isCalPopOpen, setIsCalPopOpen] = useState<boolean | undefined>(undefined);
    const [beforeString, afterString] = useMemo(() => (value ?? '')?.split(SEPARATOR) ?? [], [value]);

    const panelStyle = {
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '8px',
        width: useRange ? '50%' : undefined
    };

    const panelRender = (panel: React.ReactNode) => (
        <>
            <Row style={panelStyle}>
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
                    // Сохраняем значение в формате YYYY-MM-DD:YYYY-MM-DD
                    const periodString = (value ?? [])
                        .filter((e) => !!e)
                        .map((date) => date?.format('YYYY-MM-DD'))
                        .join(SEPARATOR);

                    if (onChange) {
                        onChange(periodString);
                    }
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
            onChange={(value) => (onChange ? onChange(value?.format('YYYY-MM-DD')) : undefined)}
        />
    );
};

const MobileDatePicker = ({
    value,
    inputStyle,
    onChange,
    useRange,
    setUseRange
}: {
    value?: string | null;
    inputStyle?: React.CSSProperties;
    onChange?: (date?: string | null) => void;
    useRange: boolean;
    setUseRange: (value: boolean) => void;
}) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [beforeString, afterString] = useMemo(() => (value ?? '')?.split(SEPARATOR) ?? [], [value]);

    const [tempDate, setTempDate] = useState<Date | [Date, Date] | null>(
        useRange ? [dayjs(beforeString)?.toDate(), dayjs(afterString)?.toDate()] : dayjs(beforeString)?.toDate()
    );

    const onChangeInner = (value: Date | [Date, Date] | null) => {
        if (onChange) {
            if (Array.isArray(value)) {
                onChange(value.map((valuePart) => dayjs(valuePart)?.format('YYYY-MM-DD')).join(SEPARATOR));

                return;
            }

            const dateJS = dayjs(value);

            onChange(dateJS?.format('YYYY-MM-DD'));
        }
    };

    return (
        <>
            <Input
                placeholder="Выберите дату"
                value={
                    Array.isArray(tempDate)
                        ? tempDate.map((date) => dayjs(date).format('DD.MM.YYYY')).join(' - ')
                        : dayjs(tempDate)?.format('DD.MM.YYYY')
                }
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
            {/* @ts-expect-error: сложный вывод типа */}
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
                value={tempDate}
                onClose={() => setIsPopupOpen(false)}
                onChange={setTempDate}
                onConfirm={onChangeInner}
                defaultValue={tempDate}
                min={dayjs(beforeString).subtract(1, 'year').toDate()}
                allowClear
            />
        </>
    );
};

export default AdaptiveDatePicker;
