import { Button, Drawer, Row } from 'antd';
import { useMemo, type ComponentProps } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

import { MobileCalendar, type MobileCalendarSummaryItem } from 'shared/components/mobile-calendar/mobile-calendar';

import styles from './mobile-calendar-picker.module.css';

const DEFAULT_HEIGHT = 'min(680px, calc(100dvh - 24px))';

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

    return (
        <Drawer title={title} placement="bottom" open={open} onClose={onClose} height={height}>
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
                    <Button onClick={onReset}>{resetLabel}</Button>
                    <Button type="primary" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </Row>
            </div>
        </Drawer>
    );
}
