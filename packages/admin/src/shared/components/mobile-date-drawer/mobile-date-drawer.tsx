import { Button, Form } from 'antd';
import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

import { MobileCalendarPicker } from 'shared/components/mobile-calendar-picker/mobile-calendar-picker';

import styles from './mobile-date-drawer.module.css';

const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY';
const EMPTY_LABEL = 'Выбрать дату';
const RESET_LABEL = 'Сбросить';

type MobileDateDrawerProps = {
    title: string;
    value?: Dayjs | null;
    onChange?: (value: Dayjs | null) => void;
    emptyLabel?: string;
};

export function MobileDateDrawer({ title, value, onChange, emptyLabel = EMPTY_LABEL }: MobileDateDrawerProps) {
    const [open, setOpen] = useState(false);
    const [panelValue, setPanelValue] = useState<Dayjs>(() => (value ?? dayjs()).locale('ru'));
    const { status } = Form.Item.useStatus();

    const triggerLabel = useMemo(() => (value ? value.format(DISPLAY_DATE_FORMAT) : emptyLabel), [emptyLabel, value]);
    const triggerClassName = [styles.trigger, status === 'error' && styles.triggerError].filter(Boolean).join(' ');

    return (
        <>
            <Button
                aria-invalid={status === 'error' ? true : undefined}
                className={triggerClassName}
                onClick={() => {
                    setPanelValue((value ?? dayjs()).locale('ru'));
                    setOpen(true);
                }}
            >
                {triggerLabel}
            </Button>
            <MobileCalendarPicker
                title={title}
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={() => setOpen(false)}
                onReset={() => onChange?.(null)}
                resetLabel={RESET_LABEL}
                value={value}
                panelValue={panelValue}
                onPanelChange={setPanelValue}
                onSelect={(nextValue) => {
                    onChange?.(nextValue);
                    setPanelValue(nextValue);
                }}
                selectedStart={value}
            />
        </>
    );
}
