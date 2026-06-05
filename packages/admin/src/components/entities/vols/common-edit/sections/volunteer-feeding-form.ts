import type { FeedTypeEntity, VolEntity } from 'interfaces';

import { intervalsToDateSets, normalizeVolunteerFeedingPayload, resolveFeedTypeId } from './feeding-calendar-utils';
import type { PaidArrivalFormInterval } from './feeding-calendar-utils';

export function createVolunteerFormOnFinish(params: {
    upstream?: (values: VolEntity) => void | Promise<void>;
    feedTypes: FeedTypeEntity[];
}) {
    return (values: VolEntity) => {
        const feeding = normalizeVolunteerFeedingPayload({
            paidArrivals: values.paid_arrivals ?? [],
            feedTypeId: values.feed_type,
            feedTypes: params.feedTypes
        });

        return params.upstream?.({
            ...values,
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
    const childFeedTypeId = resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'CHILD' });
    const isChild = childFeedTypeId !== undefined && feedTypeId === childFeedTypeId;

    const feeding = normalizeVolunteerFeedingPayload({
        paidArrivals,
        feedTypeId,
        feedTypes: params.feedTypes,
        isChild
    });

    params.form.setFieldsValue(feeding);
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

        if (feedTypeId === childFeedTypeId || feedTypeId === noFeedTypeId) {
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
