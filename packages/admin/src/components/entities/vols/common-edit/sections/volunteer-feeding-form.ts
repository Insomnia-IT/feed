import type { FormInstance } from 'antd';

import type { ArrivalEntity, FeedTypeEntity, VolEntity } from 'interfaces';

import {
    applyFeedTypeFromCalendar,
    coerceFeedTypeId,
    intervalsToDateSets,
    normalizeVolunteerFeedingPayload,
    resolveFeedTypeId,
    type PaidArrivalFormInterval
} from './feeding-calendar-utils';

export type FeedingFormSnapshot = {
    feed_type: number | undefined;
    paid_arrivals: PaidArrivalFormInterval[];
};

export function clonePaidArrivalIntervals(intervals: PaidArrivalFormInterval[]): PaidArrivalFormInterval[] {
    return intervals.map((interval) => ({ ...interval }));
}

export function captureFeedingFormSnapshot(form: { getFieldValue: (name: string) => unknown }): FeedingFormSnapshot {
    const feedTypeRaw = form.getFieldValue('feed_type');

    return {
        feed_type: coerceFeedTypeId(feedTypeRaw) ?? (typeof feedTypeRaw === 'number' ? feedTypeRaw : undefined),
        paid_arrivals: clonePaidArrivalIntervals(
            (form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalFormInterval[]
        )
    };
}

export function restoreFeedingFormSnapshot(params: {
    form: {
        setFieldValue: (name: string, value: unknown) => void;
    };
    snapshot: FeedingFormSnapshot;
}): void {
    if (params.snapshot.feed_type !== undefined) {
        params.form.setFieldValue('feed_type', params.snapshot.feed_type);
    }

    params.form.setFieldValue('paid_arrivals', clonePaidArrivalIntervals(params.snapshot.paid_arrivals));
}

/**
 * Переключение «Ребёнок»: при включении сохраняет снимок питания, при выключении восстанавливает.
 * Возвращает новое значение снимка для ref (снимок при включении, null при выключении).
 */
export function applyChildFeedingToggle(params: {
    checked: boolean;
    form: FormInstance;
    feedTypes: FeedTypeEntity[];
    childFeedTypeId: number | undefined;
    snapshot: FeedingFormSnapshot | null;
}): FeedingFormSnapshot | null {
    const { checked, form, feedTypes, childFeedTypeId, snapshot } = params;

    if (checked) {
        const nextSnapshot = captureFeedingFormSnapshot(form);

        if (childFeedTypeId !== undefined) {
            form.setFieldValue('feed_type', childFeedTypeId);
        }
        form.setFieldValue('paid_arrivals', []);
        return nextSnapshot;
    }

    if (snapshot) {
        restoreFeedingFormSnapshot({ form, snapshot });
        return null;
    }

    const paidArrivals = (form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalFormInterval[];
    const { freeDates, paidDates } = intervalsToDateSets(paidArrivals);
    const arrivals = (form.getFieldValue('arrivals') ?? []) as ArrivalEntity[];

    form.setFieldValue(
        'feed_type',
        applyFeedTypeFromCalendar({
            freeDates,
            paidDates,
            isChild: false,
            arrivals,
            feedTypes
        })
    );

    return null;
}

/** @deprecated Виртуальное поле больше не используется — состояние в feed_type, как у «Ребёнок». */
export const FREE_DURING_STAY_FORM_FIELD = 'free_during_stay';

type VolunteerFormValues = VolEntity;

/** Снимок полей питания из формы (надёжнее, чем только аргумент onFinish). */
export function readVolunteerFeedingFormState(params: { form: FormInstance; values?: VolunteerFormValues }): {
    paidArrivals: PaidArrivalFormInterval[];
    feedTypeId: number | undefined;
    arrivals: ArrivalEntity[];
    isChild: boolean;
} {
    const formSnapshot = (params.form.getFieldsValue(true) ?? {}) as VolunteerFormValues;
    const merged: VolunteerFormValues = {
        ...formSnapshot,
        ...params.values
    };

    const feedTypesFallback = merged.feed_type;
    const paidArrivals = (formSnapshot.paid_arrivals ?? merged.paid_arrivals ?? []) as PaidArrivalFormInterval[];
    const arrivals = (formSnapshot.arrivals ?? merged.arrivals ?? []) as ArrivalEntity[];
    const feedTypeId = coerceFeedTypeId(formSnapshot.feed_type ?? merged.feed_type ?? feedTypesFallback);

    return {
        paidArrivals,
        feedTypeId,
        arrivals,
        isChild: false
    };
}

export function buildVolunteerSubmitValues(params: {
    form: FormInstance;
    feedTypes: FeedTypeEntity[];
    values?: VolunteerFormValues;
}): VolEntity {
    const feedingState = readVolunteerFeedingFormState({ form: params.form, values: params.values });
    const childFeedTypeId = resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'CHILD' });
    const isChild = feedingState.feedTypeId === childFeedTypeId;

    const feeding = normalizeVolunteerFeedingPayload({
        paidArrivals: feedingState.paidArrivals,
        feedTypeId: feedingState.feedTypeId,
        feedTypes: params.feedTypes,
        isChild,
        arrivals: feedingState.arrivals
    });

    const formSnapshot = (params.form.getFieldsValue(true) ?? {}) as VolunteerFormValues;
    const merged: VolunteerFormValues = {
        ...formSnapshot,
        ...params.values
    };
    const personId = merged.person_id ?? merged.person?.id;

    return {
        ...merged,
        person: undefined,
        person_id: personId,
        feed_type: feeding.feed_type,
        paid_arrivals: feeding.paid_arrivals as VolEntity['paid_arrivals']
    };
}

export function createVolunteerFormOnFinish(params: {
    form: FormInstance;
    upstream?: (values: VolEntity) => void | Promise<void>;
    feedTypes: FeedTypeEntity[];
}) {
    return (values: VolunteerFormValues) => {
        const payload = buildVolunteerSubmitValues({
            form: params.form,
            feedTypes: params.feedTypes,
            values
        });

        return params.upstream?.(payload);
    };
}

/** Синхронизирует feed_type и paid_arrivals перед отправкой (как у «Ребёнок» / календаря). */
export function syncVolunteerFeedingFields(params: { form: FormInstance; feedTypes: FeedTypeEntity[] }): void {
    const payload = buildVolunteerSubmitValues({
        form: params.form,
        feedTypes: params.feedTypes
    });

    params.form.setFieldsValue({
        feed_type: payload.feed_type,
        paid_arrivals: payload.paid_arrivals
    });
}

/** Обработка ручного выбора типа питания (совместимость со старым Select #feed_type). */
export function applyFeedTypeSelectChange(params: {
    feedTypeId: number;
    feedTypes: FeedTypeEntity[];
    form: {
        setFieldValue: (name: string, value: unknown) => void;
        getFieldValue: (name: string) => unknown;
    };
}): void {
    const { feedTypeId, feedTypes, form } = params;
    const code = feedTypes.find(({ id }) => id === feedTypeId)?.code;
    const childFeedTypeId = resolveFeedTypeId({ feedTypes, code: 'CHILD' });
    const noFeedTypeId = resolveFeedTypeId({ feedTypes, code: 'NO' });

    form.setFieldValue('feed_type', feedTypeId);

    if (feedTypeId === childFeedTypeId || feedTypeId === noFeedTypeId || code === 'FREE' || code === 'PAID') {
        const paidArrivals = (form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalFormInterval[];
        const { freeDates, paidDates } = intervalsToDateSets(paidArrivals);

        if (feedTypeId === childFeedTypeId) {
            form.setFieldValue('paid_arrivals', []);
            return;
        }

        if (feedTypeId === noFeedTypeId) {
            form.setFieldValue('paid_arrivals', []);
            return;
        }

        if (code === 'FREE' && freeDates.size === 0 && paidDates.size === 0) {
            form.setFieldValue('paid_arrivals', []);
            return;
        }

        if (code === 'PAID' && freeDates.size === 0 && paidDates.size === 0) {
            form.setFieldValue('paid_arrivals', []);
        }
    }
}
