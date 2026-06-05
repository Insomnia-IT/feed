import { App, Button, Form } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef } from 'react';

import type { ArrivalEntity, FeedTypeEntity } from 'interfaces';

import { FeedingCalendar } from './feeding-calendar';
import {
    applyFeedTypeFromCalendar,
    buildActiveArrivalDateKeys,
    computeGristReadonlyFreeDates,
    dateSetsToIntervals,
    getDateKeysFromArrivals,
    intervalsToDateSets,
    mergeArrivalDatesIntoFreeFeeding,
    resolveFeedTypeId,
    type FeedTypeCode,
    type PaidArrivalFormInterval
} from './feeding-calendar-utils';
import styles from './feeding-calendar.module.css';

type FeedingCalendarFieldProps = {
    value?: PaidArrivalFormInterval[];
    onChange?: (value: PaidArrivalFormInterval[]) => void;
    disabled?: boolean;
    feedTypes: FeedTypeEntity[];
};

export function FeedingCalendarField({ value, onChange, disabled, feedTypes }: FeedingCalendarFieldProps) {
    const form = Form.useFormInstance();
    const { message } = App.useApp();
    const intervals = value ?? [];
    const arrivals = (Form.useWatch('arrivals', form) ?? []) as ArrivalEntity[];
    const feedTypeId = Form.useWatch('feed_type', form);
    const volunteerId = Form.useWatch('id', form);

    const gristFreeDatesInitializedRef = useRef(false);

    const { freeDates, paidDates } = useMemo(() => intervalsToDateSets(intervals), [intervals]);
    const arrivalDateKeys = useMemo(() => getDateKeysFromArrivals(arrivals), [arrivals]);
    const activeArrivalDates = useMemo(() => buildActiveArrivalDateKeys(arrivals), [arrivals]);

    const feedTypeCode = useMemo((): FeedTypeCode | null => {
        const matched = feedTypes.find(({ id }) => id === feedTypeId);
        return (matched?.code as FeedTypeCode | undefined) ?? null;
    }, [feedTypeId, feedTypes]);

    const readonlyFreeDates = useMemo(
        () =>
            computeGristReadonlyFreeDates({
                feedTypeCode,
                arrivals,
                freeDates
            }),
        [feedTypeCode, arrivals, freeDates]
    );

    const applyDateSets = (params: { freeDates: Set<string>; paidDates: Set<string> }) => {
        const nextFreeDates = new Set(params.freeDates);
        const nextPaidDates = new Set(params.paidDates);

        for (const dateKey of readonlyFreeDates) {
            nextFreeDates.add(dateKey);
            nextPaidDates.delete(dateKey);
        }

        const nextIntervals = dateSetsToIntervals({
            freeDates: nextFreeDates,
            paidDates: nextPaidDates,
            existingIntervals: intervals
        });

        onChange?.(nextIntervals);

        const nextFeedTypeId = applyFeedTypeFromCalendar({
            freeDates: nextFreeDates,
            paidDates: nextPaidDates,
            isChild: false,
            feedTypes
        });
        if (nextFeedTypeId !== undefined) {
            form.setFieldValue('feed_type', nextFeedTypeId);
        }
    };

    useEffect(() => {
        if (volunteerId == null || gristFreeDatesInitializedRef.current) {
            return;
        }

        const freeTypeId = resolveFeedTypeId({ feedTypes, code: 'FREE' });
        if (feedTypeId !== freeTypeId || intervals.length > 0 || arrivalDateKeys.size === 0) {
            if (feedTypeId === freeTypeId || intervals.length > 0) {
                gristFreeDatesInitializedRef.current = true;
            }
            return;
        }

        gristFreeDatesInitializedRef.current = true;

        const { freeDates: nextFreeDates, paidDates: nextPaidDates } = mergeArrivalDatesIntoFreeFeeding({
            arrivals,
            freeDates: new Set<string>(),
            paidDates: new Set<string>()
        });

        applyDateSets({ freeDates: nextFreeDates, paidDates: nextPaidDates });
    }, [arrivalDateKeys.size, arrivals, feedTypeId, feedTypes, intervals.length, volunteerId]);

    const handleCalendarChange = (params: { freeDates: Set<string>; paidDates: Set<string> }) => {
        applyDateSets(params);
    };

    const handleFillFromArrivals = () => {
        if (arrivalDateKeys.size === 0) {
            message.warning('Укажите даты заезда и отъезда хотя бы в одном заезде');
            return;
        }

        const {
            freeDates: nextFreeDates,
            paidDates: nextPaidDates,
            addedCount
        } = mergeArrivalDatesIntoFreeFeeding({
            arrivals,
            freeDates,
            paidDates
        });

        applyDateSets({ freeDates: nextFreeDates, paidDates: nextPaidDates });

        if (addedCount === 0) {
            message.info('Все дни заездов уже отмечены как бесплатное питание');
        }
    };

    return (
        <div>
            <FeedingCalendar
                freeDates={freeDates}
                paidDates={paidDates}
                activeArrivalDates={activeArrivalDates}
                readonlyFreeDates={readonlyFreeDates}
                onChange={handleCalendarChange}
                disabled={disabled}
            />
            <div className={styles.actions}>
                <Button
                    icon={<CalendarOutlined />}
                    disabled={disabled || arrivalDateKeys.size === 0}
                    onClick={handleFillFromArrivals}
                >
                    Заполнить бесплатно по заездам
                </Button>
            </div>
        </div>
    );
}
