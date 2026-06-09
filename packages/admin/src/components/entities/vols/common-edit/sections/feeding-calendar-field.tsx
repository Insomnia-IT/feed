import { Form } from 'antd';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ArrivalEntity, FeedTypeEntity } from 'interfaces';

import { useVolunteerFormReadinessContext } from '../../volunteer-form-readiness/volunteer-form-readiness-context';
import { VOLUNTEER_FORM_READINESS_GATES } from '../../volunteer-form-readiness/volunteer-form-readiness-gates';
import { FeedingCalendar } from './feeding-calendar';
import {
    applyFeedTypeFromCalendar,
    buildActiveArrivalDateKeys,
    buildPlannedArrivalDateKeys,
    buildPaintableArrivalDateKeys,
    resolveFeedTypeId,
    dateSetsToIntervals,
    getDateKeysFromArrivals,
    getRemovedArrivalDateKeys,
    getStayFreeDateKeys,
    intervalsToDateSets,
    removeDatesFromFeedingCalendar,
    type PaidArrivalFormInterval
} from './feeding-calendar-utils';

type FeedingCalendarFieldProps = {
    value?: PaidArrivalFormInterval[];
    onChange?: (value: PaidArrivalFormInterval[]) => void;
    disabled?: boolean;
    feedTypes: FeedTypeEntity[];
    freeDuringStay: boolean;
    freeDuringStayReady: boolean;
};

export function FeedingCalendarField({
    value,
    onChange,
    disabled,
    feedTypes,
    freeDuringStay,
    freeDuringStayReady
}: FeedingCalendarFieldProps) {
    const form = Form.useFormInstance();
    const intervals = useMemo(() => value ?? [], [value]);
    const arrivalsWatch = Form.useWatch('arrivals', form);
    const arrivals = useMemo(() => (arrivalsWatch ?? []) as ArrivalEntity[], [arrivalsWatch]);
    const dateSets = useMemo(() => intervalsToDateSets(intervals), [intervals]);
    const { freeDates, paidDates } = dateSets;
    const arrivalOutlineDates = useMemo(() => buildActiveArrivalDateKeys(arrivals), [arrivals]);
    const plannedArrivalDates = useMemo(() => buildPlannedArrivalDateKeys(arrivals), [arrivals]);
    const paintableArrivalDates = useMemo(() => buildPaintableArrivalDateKeys(arrivals), [arrivals]);
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

    const prevFreeDuringStayRef = useRef<boolean | null>(null);
    const prevArrivalsSignatureRef = useRef<string | null>(null);
    const prevArrivalDateKeysRef = useRef<Set<string>>(new Set());
    const prevFreeDuringStayReadyRef = useRef(freeDuringStayReady);
    const { setGate } = useVolunteerFormReadinessContext();

    // При переходе из «не готово» → «готово» сбрасываем prev-рефы,
    // чтобы первый синк начался без предыстории (как при первом открытии).
    useEffect(() => {
        if (!prevFreeDuringStayReadyRef.current && freeDuringStayReady) {
            prevFreeDuringStayRef.current = null;
            prevArrivalsSignatureRef.current = null;
            prevArrivalDateKeysRef.current = new Set();
        }
        prevFreeDuringStayReadyRef.current = freeDuringStayReady;
    }, [freeDuringStayReady]);

    const applyDateSets = useCallback(
        (params: { freeDates: Set<string>; paidDates: Set<string> }) => {
            const nextIntervals = dateSetsToIntervals({
                freeDates: params.freeDates,
                paidDates: params.paidDates,
                existingIntervals: intervals
            });

            onChange?.(nextIntervals);

            form.setFieldValue(
                'feed_type',
                freeDuringStay
                    ? resolveFeedTypeId({ feedTypes, code: 'FREE' })
                    : applyFeedTypeFromCalendar({
                          freeDates: params.freeDates,
                          paidDates: params.paidDates,
                          isChild: false,
                          arrivals,
                          feedTypes
                      })
            );
        },
        [arrivals, feedTypes, form, freeDuringStay, intervals, onChange]
    );

    useEffect(() => {
        if (!freeDuringStayReady) {
            setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, false);
            return;
        }

        const prevFreeDuringStay = prevFreeDuringStayRef.current;
        const prevArrivalsSignature = prevArrivalsSignatureRef.current;
        const freeDuringStayChanged = prevFreeDuringStay !== freeDuringStay;
        const arrivalsChanged = prevArrivalsSignature !== arrivalsSignature;

        if (!freeDuringStayChanged && !arrivalsChanged) {
            setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, true);
            return;
        }

        prevFreeDuringStayRef.current = freeDuringStay;
        prevArrivalsSignatureRef.current = arrivalsSignature;

        const currentArrivalDateKeys = getDateKeysFromArrivals(arrivals);
        const removedArrivalDateKeys = getRemovedArrivalDateKeys({
            previousArrivalDateKeys: prevArrivalDateKeysRef.current,
            currentArrivalDateKeys
        });
        prevArrivalDateKeysRef.current = currentArrivalDateKeys;

        if (freeDuringStayChanged && freeDuringStay) {
            // Режим «фри»: календарные интервалы не храним, только зелёные дни заезда.
            applyDateSets({ freeDates: new Set(), paidDates: new Set() });
            setGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, true);
            return;
        }

        let { freeDates: nextFreeDates, paidDates: nextPaidDates } = intervalsToDateSets(intervals);

        if (removedArrivalDateKeys.size > 0) {
            ({ freeDates: nextFreeDates, paidDates: nextPaidDates } = removeDatesFromFeedingCalendar({
                dateKeys: removedArrivalDateKeys,
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
                plannedArrivalDates={plannedArrivalDates}
                paintableArrivalDates={paintableArrivalDates}
                onChange={handleCalendarChange}
                disabled={disabled}
                freeDuringStay={freeDuringStay}
            />
        </>
    );
}
