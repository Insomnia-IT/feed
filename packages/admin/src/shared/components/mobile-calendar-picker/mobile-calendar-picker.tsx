import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Row, Typography } from 'antd';
import { useMemo, type ComponentProps } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

import { MobileCalendar, type MobileCalendarSummaryItem } from 'shared/components/mobile-calendar/mobile-calendar';

import styles from './mobile-calendar-picker.module.css';

const DEFAULT_HEIGHT = 'auto';

type MobileCalendarPickerProps = {
    title: string;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onReset?: () => void;
    confirmLabel?: string;
    resetLabel?: string;
    height?: ComponentProps<typeof Drawer>['height'];
    value?: Dayjs | null;
    panelValue?: Dayjs | null;
    onPanelChange?: (value: Dayjs) => void;
    onSelect: (value: Dayjs) => void;
    selectedStart?: Dayjs | null;
    selectedEnd?: Dayjs | null;
    summaryItems?: MobileCalendarSummaryItem[];
    topContent?: React.ReactNode;
    bottomContent?: React.ReactNode;
};

export function MobileCalendarPicker({
    title,
    open,
    onClose,
    onConfirm,
    onReset,
    confirmLabel = 'OK',
    resetLabel = 'Сбросить',
    height = DEFAULT_HEIGHT,
    value,
    panelValue,
    onPanelChange,
    onSelect,
    selectedStart,
    selectedEnd,
    summaryItems,
    topContent,
    bottomContent
}: MobileCalendarPickerProps) {
    const resolvedValue = useMemo(() => (value ?? selectedStart ?? dayjs()).locale('ru'), [selectedStart, value]);
    const handleReset = () => {
        onReset?.();
        onClose();
    };

    return (
        <Drawer
            title={
                <div className={styles.title}>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
                </div>
            }
            placement="bottom"
            open={open}
            onClose={onClose}
            height={height}
            closable={false}
            className={styles.drawer}
        >
            <div className={styles.content}>
                {topContent}
                <MobileCalendar
                    value={resolvedValue}
                    panelValue={panelValue}
                    selectedStart={selectedStart}
                    selectedEnd={selectedEnd}
                    summaryItems={summaryItems}
                    onPanelChange={onPanelChange}
                    onSelect={onSelect}
                />
                {bottomContent}
                <Row className={styles.actions}>
                    {onReset ? <Button onClick={handleReset}>{resetLabel}</Button> : <span />}
                    <Button type="primary" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </Row>
            </div>
        </Drawer>
    );
}
