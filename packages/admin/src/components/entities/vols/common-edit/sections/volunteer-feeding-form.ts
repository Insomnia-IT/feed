import type { ArrivalEntity, FeedTypeEntity, VolEntity } from 'interfaces';

import {
    intervalsToDateSets,
    normalizeVolunteerFeedingPayload,
    resolveFeedTypeId,
    type ArrivalDateInterval,
    type PaidArrivalFormInterval
} from './feeding-calendar-utils';

/** Поле формы, не уходит в API волонтёра. */
export const FREE_DURING_STAY_FORM_FIELD = 'free_during_stay';

type VolunteerFormValues = VolEntity & {
    [FREE_DURING_STAY_FORM_FIELD]?: boolean;
};

const stripInternalFeedingFields = (values: VolunteerFormValues): VolEntity => {
    const { [FREE_DURING_STAY_FORM_FIELD]: _freeDuringStay, ...rest } = values;
    return rest;
};

export function createVolunteerFormOnFinish(params: {
    upstream?: (values: VolEntity) => void | Promise<void>;
    feedTypes: FeedTypeEntity[];
}) {
    return (values: VolunteerFormValues) => {
        const feeding = normalizeVolunteerFeedingPayload({
            paidArrivals: values.paid_arrivals ?? [],
            feedTypeId: values.feed_type,
            feedTypes: params.feedTypes,
            arrivals: (values.arrivals ?? []) as ArrivalDateInterval[],
            freeDuringStay: Boolean(values[FREE_DURING_STAY_FORM_FIELD])
        });

        return params.upstream?.({
            ...stripInternalFeedingFields(values),
            feed_type: feeding.feed_type,
            paid_arrivals: feeding.paid_arrivals as VolEntity['paid_arrivals']
        });
    };
}

/** Синхронизирует feed_type и paid_arrivals перед отправкой формы. */
export function syncVolunteerFeedingFields(params: {
    form: {
        getFieldValue: (name: string) => unknown;
        setFieldsValue: (values: Record<string, unknown>) => void;
    };
    feedTypes: FeedTypeEntity[];
}): void {
    const paidArrivals = (params.form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalFormInterval[];
    const feedTypeId = params.form.getFieldValue('feed_type') as number | null | undefined;
    const arrivals = (params.form.getFieldValue('arrivals') ?? []) as ArrivalEntity[];
    const childFeedTypeId = resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'CHILD' });
    const isChild = childFeedTypeId !== undefined && feedTypeId === childFeedTypeId;

    const feeding = normalizeVolunteerFeedingPayload({
        paidArrivals,
        feedTypeId,
        feedTypes: params.feedTypes,
        isChild,
        arrivals,
        freeDuringStay: Boolean(params.form.getFieldValue(FREE_DURING_STAY_FORM_FIELD))
    });

    params.form.setFieldsValue({ feed_type: feeding.feed_type });
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
