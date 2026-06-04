import { App, Button, Form } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

import type { ArrivalEntity, FeedTypeEntity } from 'interfaces';

import { FeedingCalendar } from './feeding-calendar';
import {
    buildActiveArrivalDateKeys,
    dateSetsToIntervals,
    deriveFeedTypeCode,
    getDateKeysFromArrivals,
    intervalsToDateSets,
    mergeArrivalDatesIntoFreeFeeding,
    resolveFeedTypeId,
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

    const { freeDates, paidDates } = useMemo(() => intervalsToDateSets(intervals), [intervals]);
    const arrivalDateKeys = useMemo(() => getDateKeysFromArrivals(arrivals), [arrivals]);
    const activeArrivalDates = useMemo(() => buildActiveArrivalDateKeys(arrivals), [arrivals]);

    const applyDateSets = (params: { freeDates: Set<string>; paidDates: Set<string> }) => {
        const nextIntervals = dateSetsToIntervals({
            freeDates: params.freeDates,
            paidDates: params.paidDates,
            existingIntervals: intervals
        });

        onChange?.(nextIntervals);

        const code = deriveFeedTypeCode({ ...params, isChild: false });
        const nextFeedTypeId = resolveFeedTypeId({ feedTypes, code });
        if (nextFeedTypeId !== undefined) {
            form.setFieldValue('feed_type', nextFeedTypeId);
        }
    };

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
