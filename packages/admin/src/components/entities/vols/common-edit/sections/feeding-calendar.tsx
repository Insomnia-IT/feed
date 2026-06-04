import { Button } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import 'shared/lib/dateHelper';
import { useScreen } from 'shared/providers';

import { FeedingCalendarMobileCarousel } from './feeding-calendar-mobile-carousel';
import {
    cloneFeedingDateSets,
    FEEDING_SUMMER_MONTHS,
    formatFeedingDateKey,
    getDefaultSummerMonthIndex,
    getFeedingCalendarYear,
    paintFeedingDate,
    resolvePaintAction,
    toggleFeedingDate,
    type FeedingDateKind,
    type FeedingDateSets
} from './feeding-calendar-utils';
import styles from './feeding-calendar.module.css';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type FeedingCalendarProps = {
    freeDates: Set<string>;
    paidDates: Set<string>;
    onChange: (params: FeedingDateSets) => void;
    disabled?: boolean;
    year?: number;
};

function buildMonthCells(params: { year: number; month: number }): Array<{ key: string; day: number | null }> {
    const { year, month } = params;
    const monthStart = dayjs().year(year).month(month).startOf('month');
    const daysInMonth = monthStart.daysInMonth();
    const leadingEmpty = (monthStart.day() + 6) % 7;
    const cells: Array<{ key: string; day: number | null }> = [];

    for (let index = 0; index < leadingEmpty; index += 1) {
        cells.push({ key: `empty-${month}-${index}`, day: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = monthStart.date(day);
        cells.push({ key: formatFeedingDateKey(date), day });
    }

    return cells;
}

function MonthPanel({
    panelValue,
    freeDates,
    paidDates,
    activeMode,
    disabled,
    isPainting,
    onDatePaintStart,
    onDatePaintEnter
}: {
    panelValue: Dayjs;
    freeDates: Set<string>;
    paidDates: Set<string>;
    activeMode: FeedingDateKind;
    disabled?: boolean;
    isPainting: boolean;
    onDatePaintStart: (dateKey: string) => void;
    onDatePaintEnter: (dateKey: string) => void;
}) {
    const cells = useMemo(() => buildMonthCells({ year: panelValue.year(), month: panelValue.month() }), [panelValue]);

    return (
        <div className={styles.monthPanel}>
            <h5 className={styles.monthTitle}>{panelValue.format('MMMM YYYY')}</h5>
            <div className={styles.weekdays}>
                {WEEKDAY_LABELS.map((label) => (
                    <span key={label} className={styles.weekday}>
                        {label}
                    </span>
                ))}
            </div>
            <div className={styles.daysGrid}>
                {cells.map(({ key, day }) => {
                    if (day === null) {
                        return <span key={key} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />;
                    }

                    const dateKey = key;
                    const isFree = freeDates.has(dateKey);
                    const isPaid = paidDates.has(dateKey);
                    const cellClassName = [
                        styles.dayCell,
                        isFree ? styles.dayCellFree : '',
                        isPaid ? styles.dayCellPaid : '',
                        isPainting ? styles.dayCellPainting : ''
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <button
                            key={key}
                            type="button"
                            className={cellClassName}
                            disabled={disabled}
                            aria-pressed={isFree || isPaid}
                            aria-label={`${day} ${panelValue.format('MMMM')}${
                                isFree ? ', бесплатное питание' : isPaid ? ', платное питание' : ''
                            }`}
                            data-date-key={dateKey}
                            onPointerDown={(event) => {
                                if (event.pointerType === 'mouse' && event.button !== 0) {
                                    return;
                                }
                                event.preventDefault();
                                onDatePaintStart(dateKey);
                            }}
                            onPointerEnter={() => onDatePaintEnter(dateKey)}
                            title={activeMode === 'free' ? 'Бесплатное питание' : 'Платное питание'}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function FeedingCalendar({ freeDates, paidDates, onChange, disabled, year }: FeedingCalendarProps) {
    const { isMobile } = useScreen();
    const [activeMode, setActiveMode] = useState<FeedingDateKind>('free');
    const [paintDraft, setPaintDraft] = useState<FeedingDateSets | null>(null);
    const [isPainting, setIsPainting] = useState(false);

    const isPaintingRef = useRef(false);
    const paintActionRef = useRef<'apply' | 'remove' | null>(null);
    const paintedKeysRef = useRef<Set<string>>(new Set());
    const paintDraftRef = useRef<FeedingDateSets | null>(null);
    const sourceSetsRef = useRef<FeedingDateSets>({ freeDates, paidDates });
    const activeModeRef = useRef(activeMode);
    const disabledRef = useRef(disabled);
    const onChangeRef = useRef(onChange);

    const calendarYear = year ?? getFeedingCalendarYear();

    sourceSetsRef.current = { freeDates, paidDates };
    activeModeRef.current = activeMode;
    disabledRef.current = disabled;
    onChangeRef.current = onChange;
    paintDraftRef.current = paintDraft;

    const monthPanels = useMemo(
        () =>
            FEEDING_SUMMER_MONTHS.map((monthIndex) =>
                dayjs().year(calendarYear).month(monthIndex).startOf('month').locale('ru')
            ),
        [calendarYear]
    );

    const initialMobileMonthIndex = useMemo(() => getDefaultSummerMonthIndex({ year: calendarYear }), [calendarYear]);

    const displaySets = paintDraft ?? { freeDates, paidDates };

    const endPaint = useCallback(() => {
        if (!isPaintingRef.current) {
            return;
        }

        isPaintingRef.current = false;
        setIsPainting(false);

        const paintedKeys = [...paintedKeysRef.current];
        const draft = paintDraftRef.current;
        const source = sourceSetsRef.current;

        if (paintedKeys.length === 1) {
            onChangeRef.current(
                toggleFeedingDate({
                    dateKey: paintedKeys[0],
                    mode: activeModeRef.current,
                    freeDates: source.freeDates,
                    paidDates: source.paidDates
                })
            );
        } else if (draft) {
            onChangeRef.current(draft);
        }

        paintedKeysRef.current = new Set();
        paintActionRef.current = null;
        setPaintDraft(null);
    }, []);

    useEffect(() => {
        window.addEventListener('mouseup', endPaint);
        return () => window.removeEventListener('mouseup', endPaint);
    }, [endPaint]);

    const handleDatePaintStart = useCallback((dateKey: string) => {
        if (disabledRef.current) {
            return;
        }

        isPaintingRef.current = true;
        setIsPainting(true);
        paintedKeysRef.current = new Set([dateKey]);

        const source = sourceSetsRef.current;
        const action = resolvePaintAction({
            dateKey,
            mode: activeModeRef.current,
            freeDates: source.freeDates,
            paidDates: source.paidDates
        });
        paintActionRef.current = action;

        const draft = paintFeedingDate({
            dateKey,
            mode: activeModeRef.current,
            action,
            freeDates: source.freeDates,
            paidDates: source.paidDates
        });
        setPaintDraft(draft);
    }, []);

    const handleDatePaintEnter = useCallback((dateKey: string) => {
        if (!isPaintingRef.current || disabledRef.current) {
            return;
        }

        if (paintedKeysRef.current.has(dateKey)) {
            return;
        }

        paintedKeysRef.current.add(dateKey);
        setPaintDraft((previousDraft) => {
            const base = cloneFeedingDateSets(
                previousDraft ?? {
                    freeDates: sourceSetsRef.current.freeDates,
                    paidDates: sourceSetsRef.current.paidDates
                }
            );
            return paintFeedingDate({
                dateKey,
                mode: activeModeRef.current,
                action: paintActionRef.current ?? 'apply',
                ...base
            });
        });
    }, []);

    useEffect(() => {
        const handlePointerUp = () => endPaint();
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [endPaint]);

    const renderMonthPanel = (panelValue: Dayjs) => (
        <MonthPanel
            panelValue={panelValue}
            freeDates={displaySets.freeDates}
            paidDates={displaySets.paidDates}
            activeMode={activeMode}
            disabled={disabled}
            isPainting={isPainting}
            onDatePaintStart={handleDatePaintStart}
            onDatePaintEnter={handleDatePaintEnter}
        />
    );

    return (
        <div className={`${styles.wrap} ${isPainting ? styles.wrapPainting : ''}`}>
            <div className={styles.legend}>
                <Button
                    type={activeMode === 'free' ? 'primary' : 'default'}
                    className={styles.modeButton}
                    disabled={disabled}
                    onClick={() => setActiveMode('free')}
                >
                    <span className={`${styles.modeSwatch} ${styles.modeSwatchFree}`} />
                    Бесплатное
                </Button>
                <Button
                    type={activeMode === 'paid' ? 'primary' : 'default'}
                    className={styles.modeButton}
                    disabled={disabled}
                    onClick={() => setActiveMode('paid')}
                >
                    <span className={`${styles.modeSwatch} ${styles.modeSwatchPaid}`} />
                    Платное
                </Button>
                <p className={styles.legendHint}>
                    Выберите режим и проведите по датам с зажатой кнопкой мыши: по пустым — выделить, по уже выделенным
                    того же цвета — снять. Один клик переключает день. Платные и бесплатные дни не пересекаются.
                </p>
            </div>
            {isMobile ? (
                <FeedingCalendarMobileCarousel
                    monthPanels={monthPanels}
                    initialIndex={initialMobileMonthIndex}
                    renderMonth={renderMonthPanel}
                />
            ) : (
                <div className={styles.monthsGrid}>
                    {monthPanels.map((panelValue) => (
                        <div key={panelValue.format('YYYY-MM')}>{renderMonthPanel(panelValue)}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
