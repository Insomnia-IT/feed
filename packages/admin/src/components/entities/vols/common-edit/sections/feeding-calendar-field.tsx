import { Form } from 'antd';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ArrivalEntity, FeedTypeEntity } from 'interfaces';

import { useVolunteerFormReadinessContext } from '../../volunteer-form-readiness/volunteer-form-readiness-context';
import { VOLUNTEER_FORM_READINESS_GATES } from '../../volunteer-form-readiness/volunteer-form-readiness-gates';
import { FeedingCalendar } from './feeding-calendar';
import { FREE_DURING_STAY_FORM_FIELD } from './volunteer-feeding-form';
import {
    applyFeedTypeFromCalendar,
    buildActiveArrivalDateKeys,
    dateSetsToIntervals,
    getDateKeysFromArrivals,
    getRemovedArrivalDateKeys,
    getStayFreeDateKeys,
    intervalsToDateSets,
    mergeArrivalDatesIntoFreeFeeding,
    removeArrivalDatesFromFreeFeeding,
    removeDatesFromFeedingCalendar,
    type PaidArrivalFormInterval
} from './feeding-calendar-utils';

type FeedingCalendarFieldProps = {
    value?: PaidArrivalFormInterval[];
    onChange?: (value: PaidArrivalFormInterval[]) => void;
    disabled?: boolean;
    feedTypes: FeedTypeEntity[];
    freeDuringStayReady: boolean;
};

export function FeedingCalendarField({
    value,
    onChange,
    disabled,
    feedTypes,
    freeDuringStayReady
}: FeedingCalendarFieldProps) {
    const form = Form.useFormInstance();
    const intervals = useMemo(() => value ?? [], [value]);
    const arrivalsWatch = Form.useWatch('arrivals', form);
    const arrivals = useMemo(() => (arrivalsWatch ?? []) as ArrivalEntity[], [arrivalsWatch]);
    const freeDuringStay = Boolean(Form.useWatch(FREE_DURING_STAY_FORM_FIELD, form));

    const dateSets = useMemo(() => intervalsToDateSets(intervals), [intervals]);
    const { freeDates, paidDates } = dateSets;
    const arrivalOutlineDates = useMemo(() => buildActiveArrivalDateKeys(arrivals), [arrivals]);
    const arrivalDateKeys = useMemo(() => getDateKeysFromArrivals(arrivals), [arrivals]);
    const stayFreeDates = useMemo(
        () =>
            getStayFreeDateKeys({
                freeDates,
                arrivalDateKeys,
                freeDuringStay
            }),
        [arrivalDateKeys, freeDates, freeDuringStay]
    );

    const arrivalsSignature = useMemo(
        () =>
            arrivals
                .map(({ arrival_date, departure_date }) => `${arrival_date ?? ''}:${departure_date ?? ''}`)
                .join('|'),
        [arrivals]
    );

    const prevSyncSignatureRef = useRef<string | null>(null);
    const prevArrivalDateKeysRef = useRef<Set<string>>(new Set());
    const { setGate } = useVolunteerFormReadinessContext();

    const applyDateSets = useCallback(
        (params: { freeDates: Set<string>; paidDates: Set<string> }) => {
            const nextIntervals = dateSetsToIntervals({
                freeDates: params.freeDates,
                paidDates: params.paidDates,
                existingIntervals: intervals
            });

            onChange?.(nextIntervals);

            const nextFeedTypeId = applyFeedTypeFromCalendar({
                freeDates: params.freeDates,
                paidDates: params.paidDates,
                isChild: false,
                feedTypes
            });
            if (nextFeedTypeId !== undefined) {
                form.setFieldValue('feed_type', nextFeedTypeId);
            }
        },
        [feedTypes, form, intervals, onChange]
    );

    useEffect(() => {
        if (!freeDuringStayReady) {
            setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, false);
            return;
        }

        const syncSignature = `${freeDuringStay}:${arrivalsSignature}`;
        if (prevSyncSignatureRef.current === syncSignature) {
            setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, true);
            return;
        }

        prevSyncSignatureRef.current = syncSignature;

        const currentArrivalDateKeys = getDateKeysFromArrivals(arrivals);
        const removedArrivalDateKeys = getRemovedArrivalDateKeys({
            previousArrivalDateKeys: prevArrivalDateKeysRef.current,
            currentArrivalDateKeys
        });
        prevArrivalDateKeysRef.current = currentArrivalDateKeys;

        let { freeDates: nextFreeDates, paidDates: nextPaidDates } = intervalsToDateSets(intervals);

        if (removedArrivalDateKeys.size > 0) {
            ({ freeDates: nextFreeDates, paidDates: nextPaidDates } = removeDatesFromFeedingCalendar({
                dateKeys: removedArrivalDateKeys,
                freeDates: nextFreeDates,
                paidDates: nextPaidDates
            }));
        }

        if (freeDuringStay) {
            ({ freeDates: nextFreeDates, paidDates: nextPaidDates } = mergeArrivalDatesIntoFreeFeeding({
                arrivals,
                freeDates: nextFreeDates,
                paidDates: nextPaidDates
            }));
        } else {
            ({ freeDates: nextFreeDates, paidDates: nextPaidDates } = removeArrivalDatesFromFreeFeeding({
                arrivals,
                freeDates: nextFreeDates,
                paidDates: nextPaidDates
            }));
        }

        applyDateSets({ freeDates: nextFreeDates, paidDates: nextPaidDates });
        setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, true);
    }, [applyDateSets, arrivals, arrivalsSignature, freeDuringStay, freeDuringStayReady, intervals, setGate]);

    useEffect(() => {
        return () => {
            setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, false);
        };
    }, [setGate]);

    const handleCalendarChange = (params: { freeDates: Set<string>; paidDates: Set<string> }) => {
        applyDateSets(params);
    };

    return (
        <>
            <FeedingCalendar
                freeDates={freeDates}
                paidDates={paidDates}
                stayFreeDates={stayFreeDates}
                activeArrivalDates={arrivalOutlineDates}
                onChange={handleCalendarChange}
                disabled={disabled}
            />
        </>
    );
}
