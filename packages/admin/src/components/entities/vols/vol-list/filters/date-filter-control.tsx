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
    onConfirm: (params: { before?: string; after?: string; showPeriod: boolean }) => void;
    onReset: () => void;
    showPeriod: boolean;
};

function MobileFilterCalendarPicker({
    beforeString,
    afterString,
    open,
    onClose,
    onConfirm,
    onReset,
    showPeriod
}: MobileFilterCalendarPickerProps) {
    const [draftBeforeString, setDraftBeforeString] = useState(beforeString);
    const [draftAfterString, setDraftAfterString] = useState(afterString);
    const [draftShowPeriod, setDraftShowPeriod] = useState(showPeriod);
    const draftBeforeDate = parseDateValue(draftBeforeString);
    const draftAfterDate = parseDateValue(draftAfterString);
    const [panelValue, setPanelValue] = useState<Dayjs>(() => (draftBeforeDate ?? dayjs()).locale('ru'));

    const summaryItems = useMemo(
        () => [
            {
                label: draftShowPeriod ? 'С' : 'Дата',
                value: draftBeforeDate ? draftBeforeDate.format(DISPLAY_DATE_FORMAT) : 'Не выбрана'
            },
            ...(draftShowPeriod
                ? [
                      {
                          label: 'По',
                          value: draftAfterDate ? draftAfterDate.format(DISPLAY_DATE_FORMAT) : 'Не выбрана'
                      }
                  ]
                : [])
        ],
        [draftAfterDate, draftBeforeDate, draftShowPeriod]
    );

    const selectDraftDate = (value: Dayjs) => {
        const nextValue = formatDateValue(value);
        if (!nextValue) {
            return;
        }

        if (!draftShowPeriod) {
            setDraftBeforeString(nextValue);
            setDraftAfterString(undefined);
            return;
        }

        if (!draftBeforeString || draftAfterString) {
            setDraftBeforeString(nextValue);
            setDraftAfterString(undefined);
            return;
        }

        if (draftBeforeDate && dayjs(nextValue).isBefore(draftBeforeDate, 'day')) {
            setDraftBeforeString(nextValue);
            setDraftAfterString(draftBeforeString);
            return;
        }

        if (nextValue === draftBeforeString) {
            setDraftBeforeString(nextValue);
            setDraftAfterString(undefined);
            return;
        }

        setDraftAfterString(nextValue);
    };

    return (
        <MobileCalendarPicker
            title="Дата"
            open={open}
            onClose={onClose}
            onConfirm={() =>
                onConfirm({
                    before: draftBeforeString,
                    after: draftShowPeriod ? draftAfterString : undefined,
                    showPeriod: draftShowPeriod
                })
            }
            onReset={onReset}
            resetLabel={CLEAR_LABEL}
            value={draftBeforeDate}
            panelValue={panelValue}
            selectedStart={draftBeforeDate}
            selectedEnd={draftShowPeriod ? draftAfterDate : undefined}
            summaryItems={summaryItems}
            onPanelChange={setPanelValue}
            onSelect={selectDraftDate}
            topContent={
                <Segmented
                    block
                    value={draftShowPeriod ? RANGE_MODE : SINGLE_MODE}
                    onChange={(nextMode) => {
                        const isRangeMode = nextMode === RANGE_MODE;
                        setDraftShowPeriod(isRangeMode);

                        if (!isRangeMode) {
                            setDraftBeforeString(
                                toSingleValue({ beforeString: draftBeforeString, afterString: draftAfterString })
                            );
                            setDraftAfterString(undefined);
                        }
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

    if (isMobile) {
        return (
            <FilterFieldShell isMobile title={field.title}>
                <div className={controlClassName}>
                    <Button className={styles.dateTriggerButton} onClick={() => setIsDrawerOpen(true)}>
                        {mobileRangeLabel === PICK_DATE_LABEL ? MOBILE_PICKER_BUTTON_LABEL : mobileRangeLabel}
                    </Button>
                </div>
                {isDrawerOpen ? (
                    <MobileFilterCalendarPicker
                        open={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        beforeString={beforeString}
                        afterString={afterString}
                        showPeriod={showPeriod}
                        onConfirm={({ before, after, showPeriod: nextShowPeriod }) => {
                            setShowPeriod(nextShowPeriod);
                            changePeriodValue({ before, after });
                            setIsDrawerOpen(false);
                        }}
                        onReset={() => {
                            changeValue('');
                            setShowPeriod(false);
                        }}
                    />
                ) : null}
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
