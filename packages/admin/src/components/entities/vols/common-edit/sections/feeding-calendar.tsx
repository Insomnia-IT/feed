import { Button } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import 'shared/lib/dateHelper';
import { useScreen } from 'shared/providers';

import { FeedingCalendarMobileCarousel } from './feeding-calendar-mobile-carousel';
import {
    canApplyFeedingPaintToDate,
    canInteractWithFeedingCalendarDate,
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
    stayFreeDates?: Set<string>;
    activeArrivalDates?: Set<string>;
    plannedArrivalDates?: Set<string>;
    paintableArrivalDates?: Set<string>;
    onChange: (params: FeedingDateSets) => void;
    disabled?: boolean;
    /** Чекбокс «Бесплатно на время заезда» — скрывает режимы календаря и блокирует рисование. */
    freeDuringStay?: boolean;
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
    stayFreeDates,
    activeArrivalDates,
    plannedArrivalDates,
    paintableArrivalDates,
    activeMode,
    disabled,
    isPainting,
    onDatePaintStart,
    onDatePaintEnter
}: {
    panelValue: Dayjs;
    freeDates: Set<string>;
    paidDates: Set<string>;
    stayFreeDates: Set<string>;
    activeArrivalDates: Set<string>;
    plannedArrivalDates: Set<string>;
    paintableArrivalDates: Set<string>;
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
                    const isStayFree = stayFreeDates.has(dateKey);
                    const isFestivalFree = freeDates.has(dateKey) && !isStayFree;
                    const isPaid = paidDates.has(dateKey);
                    const isActiveArrival = activeArrivalDates.has(dateKey);
                    const isPlannedArrival = plannedArrivalDates.has(dateKey);
                    const isPaintableArrival = paintableArrivalDates.has(dateKey);
                    const canInteract = canInteractWithFeedingCalendarDate({
                        dateKey,
                        mode: activeMode,
                        paintableArrivalDates,
                        freeDates,
                        paidDates
                    });
                    const cellClassName = [
                        styles.dayCell,
                        isStayFree ? styles.dayCellFreeStay : '',
                        isFestivalFree ? styles.dayCellFreeFestival : '',
                        isPaid ? styles.dayCellPaid : '',
                        isActiveArrival ? styles.dayCellActiveArrival : '',
                        isPlannedArrival && !isActiveArrival ? styles.dayCellPlannedArrival : '',
                        !isPaintableArrival && !isFestivalFree && !isPaid ? styles.dayCellOutsideArrival : '',
                        isPainting ? styles.dayCellPainting : ''
                    ]
                        .filter(Boolean)
                        .join(' ');

                    const isOutsideArrival = !isPaintableArrival && !isFestivalFree && !isPaid && !isStayFree;

                    return (
                        <button
                            key={key}
                            type="button"
                            className={cellClassName}
                            disabled={disabled || !canInteract}
                            aria-pressed={isStayFree || isFestivalFree || isPaid}
                            aria-label={`${day} ${panelValue.format('MMMM')}${
                                isStayFree
                                    ? ', бесплатно на время заезда'
                                    : isFestivalFree
                                      ? ', за счёт фестиваля'
                                      : isPaid
                                        ? ', платно'
                                        : isPlannedArrival
                                          ? ', заезд планируется'
                                          : isOutsideArrival
                                            ? ', вне дат заезда'
                                            : ''
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
                            title={canInteract ? (activeMode === 'free' ? 'За счёт фестиваля' : 'Платно') : undefined}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function FeedingCalendar({
    freeDates,
    paidDates,
    stayFreeDates,
    activeArrivalDates,
    plannedArrivalDates,
    paintableArrivalDates,
    onChange,
    disabled,
    freeDuringStay = false,
    year
}: FeedingCalendarProps) {
    const { isMobile } = useScreen();
    const [activeMode, setActiveMode] = useState<FeedingDateKind>('free');
    const [paintDraft, setPaintDraft] = useState<FeedingDateSets | null>(null);
    const [isPainting, setIsPainting] = useState(false);

    const isPaintingRef = useRef(false);
    const paintActionRef = useRef<'apply' | 'remove' | null>(null);
    const paintedKeysRef = useRef<Set<string>>(new Set());

    const calendarYear = year ?? getFeedingCalendarYear();

    const monthPanels = useMemo(
        () =>
            FEEDING_SUMMER_MONTHS.map((monthIndex) =>
                dayjs().year(calendarYear).month(monthIndex).startOf('month').locale('ru')
            ),
        [calendarYear]
    );

    const initialMobileMonthIndex = useMemo(() => getDefaultSummerMonthIndex({ year: calendarYear }), [calendarYear]);

    const displaySets = paintDraft ?? { freeDates, paidDates };
    const resolvedActiveArrivalDates = activeArrivalDates ?? new Set<string>();
    const resolvedPlannedArrivalDates = plannedArrivalDates ?? new Set<string>();
    const resolvedPaintableArrivalDates = paintableArrivalDates ?? resolvedActiveArrivalDates;
    const resolvedStayFreeDates = stayFreeDates ?? new Set<string>();
    const calendarDisabled = disabled || freeDuringStay;

    const endPaint = useCallback(() => {
        if (!isPaintingRef.current) {
            return;
        }

        isPaintingRef.current = false;
        setIsPainting(false);

        const paintedKeys = [...paintedKeysRef.current];
        paintedKeysRef.current = new Set();
        paintActionRef.current = null;

        setPaintDraft((draft) => {
            if (paintedKeys.length === 1) {
                onChange(
                    toggleFeedingDate({
                        dateKey: paintedKeys[0],
                        mode: activeMode,
                        freeDates,
                        paidDates
                    })
                );
            } else if (draft) {
                onChange(draft);
            }

            return null;
        });
    }, [activeMode, freeDates, onChange, paidDates]);

    useEffect(() => {
        window.addEventListener('mouseup', endPaint);
        return () => window.removeEventListener('mouseup', endPaint);
    }, [endPaint]);

    const handleDatePaintStart = useCallback(
        (dateKey: string) => {
            if (calendarDisabled || resolvedStayFreeDates.has(dateKey)) {
                return;
            }

            if (
                !canInteractWithFeedingCalendarDate({
                    dateKey,
                    mode: activeMode,
                    paintableArrivalDates: resolvedPaintableArrivalDates,
                    freeDates,
                    paidDates
                })
            ) {
                return;
            }

            isPaintingRef.current = true;
            setIsPainting(true);
            paintedKeysRef.current = new Set([dateKey]);

            const action = resolvePaintAction({
                dateKey,
                mode: activeMode,
                freeDates,
                paidDates
            });
            paintActionRef.current = action;

            setPaintDraft(
                paintFeedingDate({
                    dateKey,
                    mode: activeMode,
                    action,
                    freeDates,
                    paidDates
                })
            );
        },
        [activeMode, calendarDisabled, freeDates, paidDates, resolvedPaintableArrivalDates, resolvedStayFreeDates]
    );

    const handleDatePaintEnter = useCallback(
        (dateKey: string) => {
            if (!isPaintingRef.current || calendarDisabled || resolvedStayFreeDates.has(dateKey)) {
                return;
            }

            if (paintedKeysRef.current.has(dateKey)) {
                return;
            }

            const action = paintActionRef.current ?? 'apply';
            if (
                action === 'apply' &&
                !canApplyFeedingPaintToDate({
                    dateKey,
                    paintableArrivalDates: resolvedPaintableArrivalDates
                })
            ) {
                return;
            }

            paintedKeysRef.current.add(dateKey);
            setPaintDraft((previousDraft) => {
                const base = cloneFeedingDateSets(previousDraft ?? { freeDates, paidDates });
                return paintFeedingDate({
                    dateKey,
                    mode: activeMode,
                    action,
                    ...base
                });
            });
        },
        [activeMode, calendarDisabled, freeDates, paidDates, resolvedPaintableArrivalDates, resolvedStayFreeDates]
    );

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
            stayFreeDates={resolvedStayFreeDates}
            activeArrivalDates={resolvedActiveArrivalDates}
            plannedArrivalDates={resolvedPlannedArrivalDates}
            paintableArrivalDates={resolvedPaintableArrivalDates}
            activeMode={activeMode}
            disabled={calendarDisabled}
            isPainting={isPainting}
            onDatePaintStart={handleDatePaintStart}
            onDatePaintEnter={handleDatePaintEnter}
        />
    );

    const modeSelector = freeDuringStay ? null : (
        <div className={styles.legend}>
            <Button
                type="default"
                className={`${styles.modeButton} ${activeMode === 'free' ? styles.modeButtonActiveFree : ''}`}
                disabled={disabled}
                onClick={() => setActiveMode('free')}
            >
                <span className={`${styles.modeSwatch} ${styles.modeSwatchFree}`} />
                За счёт фестиваля
            </Button>
            <Button
                type="default"
                className={`${styles.modeButton} ${activeMode === 'paid' ? styles.modeButtonActivePaid : ''}`}
                disabled={disabled}
                onClick={() => setActiveMode('paid')}
            >
                <span className={`${styles.modeSwatch} ${styles.modeSwatchPaid}`} />
                Платно
            </Button>
            <span className={styles.legendDescription}>Добавить питание можно только на даты заездов</span>
        </div>
    );

    return (
        <div className={`${styles.wrap} ${isPainting ? styles.wrapPainting : ''}`}>
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
            {modeSelector}
        </div>
    );
}
