import { useMemo, useState, type ComponentProps } from 'react';
import { Button, DatePicker, Row, Segmented, Switch, Typography } from 'antd';
import datePickerLocaleModule from 'antd/lib/date-picker/locale/ru_RU';
import dayjs, { type Dayjs } from 'dayjs';

import { MobileCalendarPicker } from 'shared/components/mobile-calendar-picker/mobile-calendar-picker';
import type { FilterField, FilterItem } from './filter-types';
import { FilterFieldShell } from './filter-field-shell';
import { isEffectiveFilterValue } from './is-effective-filter-value';
import styles from './filters.module.css';

const datePickerLocale = (
    'default' in datePickerLocaleModule ? datePickerLocaleModule.default : datePickerLocaleModule
) as NonNullable<ComponentProps<typeof DatePicker>['locale']>;

const RANGE_SEARCH_LABEL = 'Искать в диапазоне дат';
const EMPTY_LABEL = 'пусто';
const PICK_DATE_LABEL = 'Выбери дату';
const EXACT_DATE_LABEL = 'Точная дата';
const RANGE_MODE_LABEL = 'Диапазон';
const MOBILE_PICKER_BUTTON_LABEL = 'Выбрать дату';
const CLEAR_LABEL = 'Сбросить';
const DATE_FORMAT = 'YYYY-MM-DD';
const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY';
const SEPARATOR = ':';
const SINGLE_MODE = 'single';
const RANGE_MODE = 'range';

const stretchAndRingClass = (active: boolean): string | undefined =>
    [styles.volFilterControlStretch, active && styles.volActiveControlRing].filter(Boolean).join(' ') || undefined;

const parseDateValue = (value?: string) => (value ? dayjs(value) : undefined);

const formatDateValue = (value?: Dayjs) => value?.format(DATE_FORMAT);

const splitDateFilterValue = (value?: string) => {
    const [beforeString, afterString] = (value ?? '').split(SEPARATOR);

    return { beforeString, afterString };
};

const buildDateFilterValue = ({ before, after }: { before?: string; after?: string }) =>
    [before, after].filter((date): date is string => Boolean(date)).join(SEPARATOR);

const toSingleValue = ({ beforeString, afterString }: { beforeString?: string; afterString?: string }) =>
    beforeString && afterString ? beforeString : (beforeString ?? '');

const getDateRangeLabel = ({ beforeString, afterString }: { beforeString?: string; afterString?: string }) => {
    const beforeLabel = beforeString ? dayjs(beforeString).format(DISPLAY_DATE_FORMAT) : EMPTY_LABEL;

    if (!beforeString && !afterString) {
        return PICK_DATE_LABEL;
    }

    if (!afterString) {
        return beforeLabel;
    }

    return `${beforeLabel} - ${dayjs(afterString).format(DISPLAY_DATE_FORMAT)}`;
};

function DesktopDatePanelHeader({ showPeriod, onToggle }: { onToggle: () => void; showPeriod: boolean }) {
    return (
        <Row className={showPeriod ? styles.rangePanelHeader : styles.singlePanelHeader}>
            <Typography.Text>{RANGE_SEARCH_LABEL}</Typography.Text>
            <Switch size="small" value={showPeriod} onChange={onToggle} />
        </Row>
    );
}

type MobileFilterCalendarPickerProps = {
    afterString?: string;
    beforeString?: string;
    open: boolean;
    onClose: () => void;
    onReset: () => void;
    onSelectDate: (value: Dayjs) => void;
    showPeriod: boolean;
    onShowPeriodChange: (nextValue: boolean) => void;
};

function MobileFilterCalendarPicker({
    beforeString,
    afterString,
    open,
    onClose,
    onReset,
    onSelectDate,
    showPeriod,
    onShowPeriodChange
}: MobileFilterCalendarPickerProps) {
    const beforeDate = parseDateValue(beforeString);
    const afterDate = parseDateValue(afterString);
    const [panelValue, setPanelValue] = useState<Dayjs>(() => (beforeDate ?? dayjs()).locale('ru'));
    const summaryItems = useMemo(
        () => [
            {
                label: showPeriod ? 'С' : 'Дата',
                value: beforeDate ? beforeDate.format(DISPLAY_DATE_FORMAT) : 'Не выбрана'
            },
            ...(showPeriod
                ? [
                      {
                          label: 'По',
                          value: afterDate ? afterDate.format(DISPLAY_DATE_FORMAT) : 'Не выбрана'
                      }
                  ]
                : [])
        ],
        [afterDate, beforeDate, showPeriod]
    );

    return (
        <MobileCalendarPicker
            title="Дата"
            open={open}
            onClose={onClose}
            onConfirm={onClose}
            onReset={onReset}
            resetLabel={CLEAR_LABEL}
            value={beforeDate}
            panelValue={panelValue}
            selectedStart={beforeDate}
            selectedEnd={showPeriod ? afterDate : undefined}
            summaryItems={summaryItems}
            onPanelChange={setPanelValue}
            onSelect={onSelectDate}
            topContent={
                <Segmented
                    block
                    value={showPeriod ? RANGE_MODE : SINGLE_MODE}
                    onChange={(nextMode) => {
                        const isRangeMode = nextMode === RANGE_MODE;
                        onShowPeriodChange(isRangeMode);
                    }}
                    options={[
                        { label: EXACT_DATE_LABEL, value: SINGLE_MODE },
                        { label: RANGE_MODE_LABEL, value: RANGE_MODE }
                    ]}
                />
            }
        />
    );
}

type DateFilterControlProps = {
    field: FilterField;
    filterItem?: FilterItem;
    isMobile?: boolean;
    onFilterTextValueChange: (fieldName: string, value?: string) => void;
};

export function DateFilterControl({ field, filterItem, isMobile, onFilterTextValueChange }: DateFilterControlProps) {
    const [isCalPopOpen, setIsCalPopOpen] = useState<boolean | undefined>(undefined);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const filterValue = filterItem?.value as string | undefined;
    const controlClassName = stretchAndRingClass(isEffectiveFilterValue(filterValue));
    const [showPeriod, setShowPeriod] = useState(() => Boolean(filterValue?.includes(SEPARATOR)));

    const { beforeString, afterString } = splitDateFilterValue(filterValue);
    const beforeDate = parseDateValue(beforeString);
    const afterDate = parseDateValue(afterString);
    const mobileRangeLabel = useMemo(
        () =>
            getDateRangeLabel({
                beforeString,
                afterString
            }),
        [afterString, beforeString]
    );

    const changeValue = (value: string) => onFilterTextValueChange(field.name, value);
    const changePeriodValue = ({ before, after }: { before?: string; after?: string }) => {
        changeValue(buildDateFilterValue({ before, after }));
    };
    const togglePeriod = () => {
        setShowPeriod((prev) => {
            const next = !prev;

            if (!next) {
                changeValue(toSingleValue({ beforeString, afterString }));
            }

            return next;
        });
    };

    const handleMobileShowPeriodChange = (nextIsRangeMode: boolean) => {
        setShowPeriod(nextIsRangeMode);

        if (!nextIsRangeMode) {
            changeValue(toSingleValue({ beforeString, afterString }));
        }
    };

    const onMobileSelectDate = (value: Dayjs) => {
        const nextValue = formatDateValue(value);
        if (!nextValue) {
            return;
        }

        if (!showPeriod) {
            changeValue(nextValue);
            return;
        }

        if (!beforeString || afterString) {
            changePeriodValue({ before: nextValue, after: undefined });
            return;
        }

        if (beforeDate && dayjs(nextValue).isBefore(beforeDate, 'day')) {
            changePeriodValue({ before: nextValue, after: beforeString });
            return;
        }

        if (nextValue === beforeString) {
            changePeriodValue({ before: nextValue, after: undefined });
            return;
        }

        changePeriodValue({ before: beforeString, after: nextValue });
    };

    if (isMobile) {
        return (
            <FilterFieldShell isMobile title={field.title}>
                <div className={controlClassName}>
                    <Button className={styles.dateTriggerButton} onClick={() => setIsDrawerOpen(true)}>
                        {mobileRangeLabel === PICK_DATE_LABEL ? MOBILE_PICKER_BUTTON_LABEL : mobileRangeLabel}
                    </Button>
                </div>
                <MobileFilterCalendarPicker
                    open={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    beforeString={beforeString}
                    afterString={afterString}
                    showPeriod={showPeriod}
                    onShowPeriodChange={handleMobileShowPeriodChange}
                    onSelectDate={onMobileSelectDate}
                    onReset={() => {
                        changeValue('');
                        setShowPeriod(false);
                    }}
                />
            </FilterFieldShell>
        );
    }

    return (
        <FilterFieldShell title={field.title}>
            <div className={controlClassName}>
                {showPeriod ? (
                    <DatePicker.RangePicker
                        locale={datePickerLocale}
                        open={isCalPopOpen}
                        onOpenChange={setIsCalPopOpen}
                        inputReadOnly
                        placeholder={[EMPTY_LABEL, EMPTY_LABEL]}
                        panelRender={(panel) => (
                            <>
                                <DesktopDatePanelHeader showPeriod={showPeriod} onToggle={togglePeriod} />
                                {panel}
                            </>
                        )}
                        allowEmpty={[true, true]}
                        className={styles.desktopDatePicker}
                        value={[beforeDate, afterDate]}
                        onChange={(value) => {
                            changeValue(
                                buildDateFilterValue({
                                    before: value?.[0]?.format(DATE_FORMAT),
                                    after: value?.[1]?.format(DATE_FORMAT)
                                })
                            );
                        }}
                    />
                ) : (
                    <DatePicker
                        locale={datePickerLocale}
                        open={isCalPopOpen}
                        onOpenChange={setIsCalPopOpen}
                        inputReadOnly
                        placeholder={PICK_DATE_LABEL}
                        panelRender={(panel) => (
                            <>
                                <DesktopDatePanelHeader showPeriod={showPeriod} onToggle={togglePeriod} />
                                {panel}
                            </>
                        )}
                        value={beforeDate}
                        className={styles.desktopDatePicker}
                        onChange={(value) => {
                            changeValue(value?.format(DATE_FORMAT) ?? '');
                        }}
                    />
                )}
            </div>
        </FilterFieldShell>
    );
}
