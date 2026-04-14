import { Button, TimePicker } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

import { MobileCalendarPicker } from 'shared/components/mobile-calendar-picker/mobile-calendar-picker';

import styles from './mobile-date-time-drawer.module.css';

const MOBILE_TIME_FORMAT = 'HH:mm:ss';
const DEFAULT_HEIGHT = 'min(680px, calc(100dvh - 24px))';

const mergeDateAndTime = ({ date, time }: { date: Dayjs; time: Dayjs }) =>
    date.hour(time.hour()).minute(time.minute()).second(time.second()).millisecond(0);

type MobileDateTimeDrawerProps = {
    title: string;
    open: boolean;
    value?: Dayjs | null;
    onOpen: () => void;
    onClose: () => void;
    onConfirm: (value: Dayjs | null) => void;
    onReset?: () => void;
    confirmLabel?: string;
    resetLabel?: string;
    emptyLabel?: string;
    triggerLabel?: string;
    height?: string | number;
};

type OpenedMobileDateTimeDrawerProps = Omit<MobileDateTimeDrawerProps, 'open' | 'onOpen'>;

function OpenedMobileDateTimeDrawer({
    title,
    value,
    onClose,
    onConfirm,
    onReset,
    confirmLabel = 'OK',
    resetLabel = 'Сбросить',
    height = DEFAULT_HEIGHT
}: OpenedMobileDateTimeDrawerProps) {
    const initialValue = (value ?? dayjs()).locale('ru');
    const [draftDate, setDraftDate] = useState<Dayjs | null>(value ? initialValue : null);
    const [draftTime, setDraftTime] = useState<Dayjs | null>(value ? initialValue : null);
    const [panelValue, setPanelValue] = useState<Dayjs>(initialValue);

    const summaryItems = useMemo(
        () => [
            {
                label: 'Дата',
                value: draftDate ? draftDate.format('DD.MM.YYYY') : 'Не выбрана'
            }
        ],
        [draftDate]
    );

    const handleReset = useCallback(() => {
        setDraftDate(null);
        setDraftTime(null);
        onReset?.();
        onConfirm(null);
    }, [onConfirm, onReset]);

    const handleConfirm = useCallback(() => {
        if (draftDate && draftTime) {
            onConfirm(mergeDateAndTime({ date: draftDate, time: draftTime }));
        }

        onClose();
    }, [draftDate, draftTime, onClose, onConfirm]);

    return (
        <MobileCalendarPicker
            title={title}
            open
            onClose={onClose}
            onConfirm={handleConfirm}
            onReset={handleReset}
            confirmLabel={confirmLabel}
            resetLabel={resetLabel}
            height={height}
            value={draftDate}
            panelValue={panelValue}
            onPanelChange={setPanelValue}
            onSelect={(nextValue) => {
                setDraftDate(nextValue);
                setPanelValue(nextValue);
            }}
            selectedStart={draftDate}
            summaryItems={summaryItems}
            bottomContent={
                <div className={styles.timeBlock}>
                    <span className={styles.timeLabel}>Время</span>
                    <TimePicker
                        value={draftTime}
                        format={MOBILE_TIME_FORMAT}
                        needConfirm={false}
                        className={styles.timePicker}
                        onChange={(nextValue) => setDraftTime(nextValue)}
                    />
                </div>
            }
        />
    );
}

export function MobileDateTimeDrawer({
    open,
    value,
    onOpen,
    onClose,
    emptyLabel = 'Выбрать дату и время',
    triggerLabel,
    ...restProps
}: MobileDateTimeDrawerProps) {
    const resolvedTriggerLabel = useMemo(() => {
        if (triggerLabel) {
            return triggerLabel;
        }

        return value ? value.format('DD.MM.YYYY HH:mm') : emptyLabel;
    }, [emptyLabel, triggerLabel, value]);

    return (
        <>
            <Button className={styles.trigger} onClick={() => (open ? onClose() : onOpen())}>
                {resolvedTriggerLabel}
            </Button>
            {open ? <OpenedMobileDateTimeDrawer value={value} onClose={onClose} {...restProps} /> : null}
        </>
    );
}
