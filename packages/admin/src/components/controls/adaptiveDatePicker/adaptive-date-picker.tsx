import { useScreen } from '../../../shared/providers';
import { DatePicker, Input } from 'antd';
import { CalendarPicker } from 'antd-mobile';
import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';

const AdaptiveDatePicker = ({
    value,
    style,
    onChange,
    open,
    onOpenChange,
    panelRender
}: {
    open?: boolean;
    onOpenChange?: (value: boolean) => void;
    panelRender?: (originPanel: React.ReactNode) => React.ReactNode;
    value?: Dayjs | null;
    onChange: ((date: Dayjs | null, dateString: string | string[]) => void) | undefined;
    style?: React.CSSProperties;
}) => {
    const { isMobile = true } = useScreen();

    if (isMobile) {
        return <MobileDatePicker value={value} onChange={onChange} />;
    }

    return (
        <DatePicker
            onOpenChange={onOpenChange}
            panelRender={panelRender}
            style={style}
            value={value}
            open={open}
            onChange={onChange}
        />
    );
};

const MobileDatePicker = ({
    value,
    inputStyle,
    onChange
}: {
    value?: Dayjs | null;
    inputStyle?: React.CSSProperties;
    onChange?: (date: Dayjs | null, dateString: string | string[]) => void;
}) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(value ? value.toDate() : null);

    const onChangeInner = (date: Date | null) => {
        const dateJS = dayjs(date);

        if (onChange) {
            onChange(dateJS, dateJS.toISOString());
        }
    };

    return (
        <>
            <Input
                placeholder="Выберите дату"
                value={value?.format('DD.MM.YYYY')}
                style={inputStyle}
                onClick={() => setIsPopupOpen(true)}
                onClear={() => {
                    if (onChange) {
                        onChange(null, []);
                    }
                }}
                allowClear
                suffix={value ? null : <CalendarOutlined />}
            />
            <CalendarPicker
                weekStartsOn="Monday"
                title={'Выбор даты'}
                selectionMode="single"
                visible={isPopupOpen}
                value={tempDate}
                onClose={() => setIsPopupOpen(false)}
                onChange={setTempDate}
                onConfirm={onChangeInner}
            />
        </>
    );
};

export default AdaptiveDatePicker;
