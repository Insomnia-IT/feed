import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Calendar, Typography, type CalendarProps } from 'antd';
import calendarLocaleModule from 'antd/lib/calendar/locale/ru_RU';
import { useMemo, useState, type ComponentProps } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

import styles from './mobile-calendar.module.css';

const calendarLocale = (
    'default' in calendarLocaleModule ? calendarLocaleModule.default : calendarLocaleModule
) as NonNullable<ComponentProps<typeof Calendar>['locale']>;

type MobileCalendarSummaryItem = {
    label: string;
    value: string;
};

type MobileCalendarProps = {
    value?: Dayjs | null;
    onSelect: (value: Dayjs) => void;
    panelValue?: Dayjs | null;
    onPanelChange?: (value: Dayjs) => void;
    selectedStart?: Dayjs | null;
    selectedEnd?: Dayjs | null;
    summaryItems?: MobileCalendarSummaryItem[];
    className?: string;
};

const getDateCellClassName = ({
    current,
    selectedStart,
    selectedEnd
}: {
    current: Dayjs;
    selectedStart?: Dayjs | null;
    selectedEnd?: Dayjs | null;
}) => {
    if (!selectedStart) {
        return styles.dateCell;
    }

    if (!selectedEnd) {
        return current.isSame(selectedStart, 'day') ? `${styles.dateCell} ${styles.dateCellSelected}` : styles.dateCell;
    }

    const isStart = current.isSame(selectedStart, 'day');
    const isEnd = current.isSame(selectedEnd, 'day');
    const isBetween = current.isAfter(selectedStart, 'day') && current.isBefore(selectedEnd, 'day');

    if (isStart || isEnd) {
        return `${styles.dateCell} ${styles.dateCellSelected}`;
    }

    if (isBetween) {
        return `${styles.dateCell} ${styles.dateCellInRange}`;
    }

    return styles.dateCell;
};

export function MobileCalendar({
    value,
    onSelect,
    panelValue,
    onPanelChange,
    selectedStart,
    selectedEnd,
    summaryItems,
    className = ''
}: MobileCalendarProps) {
    const [internalPanelValue, setInternalPanelValue] = useState<Dayjs>(() => (value ?? dayjs()).locale('ru'));

    const resolvedPanelValue = useMemo(
        () => (panelValue ?? internalPanelValue ?? dayjs()).locale('ru'),
        [internalPanelValue, panelValue]
    );

    const handlePanelChange: CalendarProps<Dayjs>['onPanelChange'] = (nextValue) => {
        const localizedValue = nextValue.locale('ru');
        setInternalPanelValue(localizedValue);
        onPanelChange?.(localizedValue);
    };

    return (
        <div className={`${styles.wrap} ${className}`.trim()}>
            {summaryItems && summaryItems.length > 0 ? (
                <div className={styles.summary}>
                    {summaryItems.map((item) => (
                        <div key={item.label} className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>{item.label}</span>
                            <span className={styles.summaryValue}>{item.value}</span>
                        </div>
                    ))}
                </div>
            ) : null}

            <Calendar
                locale={calendarLocale}
                fullscreen={false}
                value={resolvedPanelValue}
                onPanelChange={handlePanelChange}
                onSelect={(nextValue) => onSelect(nextValue.locale('ru'))}
                headerRender={({ value: headerValue, onChange }) => (
                    <div className={styles.header}>
                        <Button
                            type="text"
                            icon={<LeftOutlined />}
                            onClick={() => {
                                const nextValue = headerValue.subtract(1, 'month').locale('ru');
                                setInternalPanelValue(nextValue);
                                onPanelChange?.(nextValue);
                                onChange(nextValue);
                            }}
                        />
                        <Typography.Text strong>{headerValue.format('MMMM YYYY')}</Typography.Text>
                        <Button
                            type="text"
                            icon={<RightOutlined />}
                            onClick={() => {
                                const nextValue = headerValue.add(1, 'month').locale('ru');
                                setInternalPanelValue(nextValue);
                                onPanelChange?.(nextValue);
                                onChange(nextValue);
                            }}
                        />
                    </div>
                )}
                fullCellRender={(current) => (
                    <div
                        className={getDateCellClassName({
                            current,
                            selectedStart,
                            selectedEnd
                        })}
                    >
                        {current.date()}
                    </div>
                )}
            />
        </div>
    );
}

export type { MobileCalendarSummaryItem };
