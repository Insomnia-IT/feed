import { useEffect, useMemo, useRef } from 'react';
import { Form, Select, Checkbox } from 'antd';
import { useLocation } from 'react-router';

import { Rules } from 'components/form';
import type { ArrivalEntity, FeedTypeEntity } from 'interfaces';

import styles from '../../common.module.css';
import { FeedingCalendarField } from './feeding-calendar-field';
import {
    applyFeedTypeFromCalendar,
    getDateKeysFromArrivals,
    intervalsToDateSets,
    isFreeFeedingDuringStayChecked,
    resolveFeedTypeId
} from './feeding-calendar-utils';
import type { PaidArrivalFormInterval } from './feeding-calendar-utils';
import { applyFeedTypeSelectChange, FREE_DURING_STAY_FORM_FIELD } from './volunteer-feeding-form';
import { FeedingCalendarReadinessReporter } from '../../volunteer-form-readiness/feeding-calendar-readiness-reporter';
import { useVolunteerFormReadinessGate, VOLUNTEER_FORM_READINESS_GATES } from '../../volunteer-form-readiness';

export const FeedingSection = ({
    denyBadgeEdit,
    denyFeedTypeEdit,
    kitchenOptions,
    feedTypes
}: {
    denyBadgeEdit: boolean;
    denyFeedTypeEdit: boolean;
    kitchenOptions: { label: string; value: string | number }[];
    feedTypes: FeedTypeEntity[];
}) => {
    const form = Form.useFormInstance();
    const { pathname } = useLocation();
    const isCreationProcess = pathname.includes('create');
    const feedTypeId = Form.useWatch('feed_type', form);
    const volunteerId = Form.useWatch('id', form);
    const arrivalsWatch = Form.useWatch('arrivals', form);
    const arrivals = useMemo(() => (arrivalsWatch ?? []) as ArrivalEntity[], [arrivalsWatch]);
    const paidArrivalsWatch = Form.useWatch('paid_arrivals', form);
    const paidArrivals = useMemo(() => (paidArrivalsWatch ?? []) as PaidArrivalFormInterval[], [paidArrivalsWatch]);
    const freeDuringStayValue = Form.useWatch(FREE_DURING_STAY_FORM_FIELD, form);

    const childFeedTypeId = feedTypes.find(({ code }) => code === 'CHILD')?.id;
    const noFeedTypeId = feedTypes.find(({ code }) => code === 'NO')?.id;
    const freeFeedTypeId = resolveFeedTypeId({ feedTypes, code: 'FREE' });

    const isChild = childFeedTypeId !== undefined && feedTypeId === childFeedTypeId;
    const isNoFeed = noFeedTypeId !== undefined && feedTypeId === noFeedTypeId;
    const showCalendar = !isChild;

    const arrivalDateKeys = useMemo(() => getDateKeysFromArrivals(arrivals), [arrivals]);
    const hasArrivals = arrivalDateKeys.size > 0;
    const arrivalCount = arrivals.length;
    const freeDuringStayLabel = arrivalCount > 1 ? 'Бесплатно на время заездов' : 'Бесплатно на время заезда';

    const freeDuringStayInitRef = useRef(false);
    const freeDuringStayBeforeChildRef = useRef<boolean | null>(null);
    const wasChildRef = useRef(false);

    const feedTypeSelectOptions = useMemo(
        () => feedTypes.map(({ id, name }) => ({ label: name, value: id })),
        [feedTypes]
    );

    const initialFreeDuringStay = useMemo(() => {
        if (isChild) {
            return true;
        }

        const { freeDates } = intervalsToDateSets(paidArrivals);
        const isGristFreeVolunteer =
            volunteerId != null &&
            freeFeedTypeId !== undefined &&
            feedTypeId === freeFeedTypeId &&
            paidArrivals.length === 0 &&
            hasArrivals;

        return (
            isGristFreeVolunteer ||
            isFreeFeedingDuringStayChecked({
                arrivals,
                freeDates
            })
        );
    }, [arrivals, feedTypeId, freeFeedTypeId, hasArrivals, isChild, paidArrivals, volunteerId]);

    const freeDuringStayReady = isChild || volunteerId == null || freeDuringStayValue === initialFreeDuringStay;
    const feedingFreeDuringStayGateReady = feedTypes.length > 0 && (isChild || freeDuringStayReady);
    const createDefaultFeedTypeReady = !isCreationProcess || noFeedTypeId === undefined || feedTypeId != null;

    useVolunteerFormReadinessGate(VOLUNTEER_FORM_READINESS_GATES.feedingFreeDuringStay, feedingFreeDuringStayGateReady);
    useVolunteerFormReadinessGate(VOLUNTEER_FORM_READINESS_GATES.feedingCreateDefaultType, createDefaultFeedTypeReady);

    useEffect(() => {
        if (!isCreationProcess || noFeedTypeId === undefined) {
            return;
        }

        const currentFeedType = form.getFieldValue('feed_type');
        if (currentFeedType == null) {
            form.setFieldValue('feed_type', noFeedTypeId);
        }
    }, [form, isCreationProcess, noFeedTypeId]);

    useEffect(() => {
        if (isChild && !wasChildRef.current) {
            freeDuringStayBeforeChildRef.current = Boolean(form.getFieldValue(FREE_DURING_STAY_FORM_FIELD));
            form.setFieldValue(FREE_DURING_STAY_FORM_FIELD, true);
        } else if (!isChild && wasChildRef.current && freeDuringStayBeforeChildRef.current !== null) {
            form.setFieldValue(FREE_DURING_STAY_FORM_FIELD, freeDuringStayBeforeChildRef.current);
            freeDuringStayBeforeChildRef.current = null;
        }

        wasChildRef.current = isChild;
    }, [form, isChild]);

    useEffect(() => {
        if (freeDuringStayInitRef.current || isChild) {
            return;
        }

        form.setFieldValue(FREE_DURING_STAY_FORM_FIELD, initialFreeDuringStay);
        freeDuringStayInitRef.current = true;
    }, [form, initialFreeDuringStay, isChild]);

    const handleChildChange = (checked: boolean) => {
        if (checked) {
            if (childFeedTypeId !== undefined) {
                form.setFieldValue('feed_type', childFeedTypeId);
            }
            form.setFieldValue('paid_arrivals', []);
            return;
        }

        const { freeDates, paidDates } = intervalsToDateSets(paidArrivals);
        const nextFeedTypeId = applyFeedTypeFromCalendar({
            freeDates,
            paidDates,
            isChild: false,
            feedTypes
        });
        if (nextFeedTypeId !== undefined) {
            form.setFieldValue('feed_type', nextFeedTypeId);
        }
    };

    return (
        <>
            {isChild ? <FeedingCalendarReadinessReporter ready /> : null}
            <div className={styles.formSection__title}>
                <h4>Питание</h4>
            </div>

            <div className={styles.feedingFieldRow}>
                <Form.Item className={styles.feedingFieldKitchen} label="Кухня" name="kitchen" rules={Rules.required}>
                    <Select options={kitchenOptions} disabled={denyBadgeEdit} />
                </Form.Item>
                <div className={styles.feedingCheckboxesGroup}>
                    <div className={styles.feedingCheckboxesRow}>
                        <Form.Item name="is_vegan" valuePropName="checked" noStyle>
                            <Checkbox>Веган</Checkbox>
                        </Form.Item>
                        <Checkbox
                            checked={isChild}
                            disabled={denyFeedTypeEdit}
                            onChange={(event) => handleChildChange(event.target.checked)}
                        >
                            Ребёнок
                        </Checkbox>
                        <span className={styles.feedingCheckboxFreeDuringStay}>
                            <Form.Item
                                name={FREE_DURING_STAY_FORM_FIELD}
                                valuePropName="checked"
                                noStyle
                                initialValue={false}
                            >
                                <Checkbox disabled={denyFeedTypeEdit || !hasArrivals || isChild}>
                                    {freeDuringStayLabel}
                                </Checkbox>
                            </Form.Item>
                        </span>
                    </div>
                </div>
            </div>

            <Form.Item
                name="feed_type"
                rules={Rules.required}
                className={styles.feedTypeCompatSelectWrap}
                colon={false}
                label=" "
            >
                <Select
                    id="feed_type"
                    disabled={denyFeedTypeEdit}
                    options={feedTypeSelectOptions}
                    onChange={(value: number) => {
                        applyFeedTypeSelectChange({ feedTypeId: value, feedTypes, form });
                    }}
                />
            </Form.Item>

            {isChild ? (
                <p className={styles.sectionHint}>Ребёнок питается бесплатно весь период пребывания на поле.</p>
            ) : null}

            {isNoFeed ? (
                <p className={styles.sectionHint}>
                    Этот волонтёр без питания. Если вы уверены что это не так, занесите питание в календарь ниже
                </p>
            ) : null}

            {showCalendar ? (
                <Form.Item name="paid_arrivals" noStyle initialValue={[]}>
                    <FeedingCalendarField
                        feedTypes={feedTypes}
                        disabled={denyFeedTypeEdit}
                        freeDuringStayReady={freeDuringStayReady}
                    />
                </Form.Item>
            ) : null}
        </>
    );
};
