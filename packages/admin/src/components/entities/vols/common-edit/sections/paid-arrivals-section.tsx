import { Button, DatePicker, Form } from 'antd';
import { useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';
import { MobileDateDrawer } from 'shared/components/mobile-date-drawer/mobile-date-drawer';
import { formDateFormat } from 'shared/lib';
import { useScreen } from 'shared/providers';

import styles from '../../common.module.css';
import { type BaseFeedTypeCode, getExceptionIsFree, getFeedExceptionCopy } from './feed-exception-copy';

type PaidArrivalInterval = {
    arrival_date?: string;
    departure_date?: string;
    is_free?: boolean;
};

const isInsideOtherPaidArrival = (otherArrival: PaidArrivalInterval, currentArrival: PaidArrivalInterval) => {
    const arrival = dayjs(otherArrival.arrival_date);
    const departure = dayjs(otherArrival.departure_date);

    const targetStart = dayjs(currentArrival.arrival_date);
    const targetEnd = dayjs(currentArrival.departure_date);

    return (
        (targetStart.isBefore(departure) && targetStart.isAfter(arrival)) ||
        (targetEnd.isAfter(arrival) && targetEnd.isBefore(departure)) ||
        (targetStart.isBefore(arrival) && targetEnd.isAfter(departure))
    );
};

export const PaidArrivalsSection = ({
    visible,
    baseFeedTypeCode
}: {
    visible: boolean;
    baseFeedTypeCode: BaseFeedTypeCode | null;
}) => {
    const form = Form.useFormInstance();
    const copy = baseFeedTypeCode ? getFeedExceptionCopy(baseFeedTypeCode) : null;
    const exceptionIsFree = baseFeedTypeCode ? getExceptionIsFree(baseFeedTypeCode) : false;

    useEffect(() => {
        if (!visible || !baseFeedTypeCode) {
            return;
        }

        const paidArrivals = (form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalInterval[];
        if (paidArrivals.length === 0) {
            return;
        }

        const needsUpdate = paidArrivals.some((item) => item.is_free !== exceptionIsFree);
        if (!needsUpdate) {
            return;
        }

        form.setFieldValue(
            'paid_arrivals',
            paidArrivals.map((item) => ({ ...item, is_free: exceptionIsFree }))
        );
    }, [baseFeedTypeCode, exceptionIsFree, form, visible]);

    const activeFromValidationRules = useCallback(
        (index: number) => [
            ...Rules.required,
            {
                validator: async (_: unknown, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const paidArrivals = form.getFieldValue('paid_arrivals') as PaidArrivalInterval[];
                    const targetArrival = paidArrivals[index];
                    const otherArrivals = paidArrivals.filter((_, ind) => ind !== index);

                    const arrivalDates = paidArrivals
                        .slice()
                        .map((arrival) => dayjs(arrival.arrival_date).format('YYYY-MM-DD'));

                    arrivalDates.splice(index, 1);

                    if (arrivalDates.includes(dayjs(value).format('YYYY-MM-DD'))) {
                        return Promise.reject(new Error('Дата начала не должна повторяться'));
                    }

                    if (otherArrivals.some((otherArrival) => isInsideOtherPaidArrival(otherArrival, targetArrival))) {
                        return Promise.reject(
                            new Error(copy?.overlapError ?? 'Периоды исключений не должны пересекаться')
                        );
                    }

                    return Promise.resolve();
                }
            }
        ],
        [copy?.overlapError, form]
    );

    const activeToValidationRules = useCallback(
        (index: number) => [
            ...Rules.required,
            {
                validator: async (_: unknown, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const arrivalDate = form.getFieldValue(['paid_arrivals', index, 'arrival_date']);
                    const paidArrivals = form.getFieldValue('paid_arrivals') as PaidArrivalInterval[];
                    const targetArrival = paidArrivals[index];
                    const otherArrivals = paidArrivals.filter((_, ind) => ind !== index);

                    if (otherArrivals.some((otherArrival) => isInsideOtherPaidArrival(otherArrival, targetArrival))) {
                        return Promise.reject(
                            new Error(copy?.overlapError ?? 'Периоды исключений не должны пересекаться')
                        );
                    }

                    if (dayjs(value).isBefore(dayjs(arrivalDate))) {
                        return Promise.reject(new Error('Дата окончания не может быть раньше даты начала'));
                    }

                    return Promise.resolve();
                }
            }
        ],
        [copy?.overlapError, form]
    );

    if (!visible || !baseFeedTypeCode || !copy) {
        return null;
    }

    return (
        <div className={styles.feedingPaidBlock}>
            <Form.List name="paid_arrivals">
                {(paidArrivalFields, { add, remove }) => {
                    const addPaidArrival = () => {
                        add({
                            id: uuidv4(),
                            is_free: exceptionIsFree
                        });
                    };
                    const isEmpty = paidArrivalFields.length === 0;

                    const addExceptionButton = (
                        <div className={styles.addArrivalActions}>
                            <Button
                                key="add"
                                color="primary"
                                variant="outlined"
                                icon={<PlusSquareOutlined />}
                                onClick={addPaidArrival}
                            >
                                {copy.addButton}
                            </Button>
                        </div>
                    );

                    return (
                        <>
                            {isEmpty ? (
                                <div className={styles.paidArrivalsEmptyState}>
                                    <p className={styles.paidArrivalsEmptyHint}>{copy.sectionTooltip}</p>
                                    {addExceptionButton}
                                </div>
                            ) : (
                                <>
                                    <p className={styles.sectionHint}>{copy.hint}</p>
                                    <div>
                                        {paidArrivalFields.map((paidArrivalField, index) => (
                                            <PaidArrivalItem
                                                key={paidArrivalField.key}
                                                index={index}
                                                intervalTitle={copy.intervalTitle(index)}
                                                exceptionIsFree={exceptionIsFree}
                                                remove={remove}
                                                activeFromValidationRules={activeFromValidationRules}
                                                activeToValidationRules={activeToValidationRules}
                                            />
                                        ))}
                                    </div>
                                    {addExceptionButton}
                                </>
                            )}
                        </>
                    );
                }}
            </Form.List>
        </div>
    );
};

function PaidArrivalItem({
    index,
    intervalTitle,
    exceptionIsFree,
    remove,
    activeFromValidationRules,
    activeToValidationRules
}: {
    index: number;
    intervalTitle: string;
    exceptionIsFree: boolean;
    remove: (index: number) => void;
    activeFromValidationRules: (index: number) => Array<
        | { required: boolean }
        | {
              validator: (
                  rule: unknown,
                  value: string | number | Date | dayjs.Dayjs | null | undefined
              ) => Promise<void>;
          }
    >;
    activeToValidationRules: (index: number) => Array<
        | { required: boolean }
        | {
              validator: (
                  rule: unknown,
                  value: string | number | Date | dayjs.Dayjs | null | undefined
              ) => Promise<void>;
          }
    >;
}) {
    const form = Form.useFormInstance();
    const { isMobile } = useScreen();

    useEffect(() => {
        form.setFieldValue(['paid_arrivals', index, 'is_free'], exceptionIsFree);
    }, [exceptionIsFree, form, index]);

    const createDateChange = (fieldName: string) => (value: string | number | Date | dayjs.Dayjs | null) => {
        const normalizedValue = dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;
        form.setFieldValue(['paid_arrivals', index, fieldName], normalizedValue);
    };

    const normalizeDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) =>
        dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;

    const getDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) => ({
        value: value ? dayjs(value) : undefined
    });

    const deleteButton = (
        <Button
            className={styles.deleteButton}
            danger
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => remove(index)}
        >
            Удалить
        </Button>
    );

    const startDateField = (
        <Form.Item
            className={isMobile ? styles.arrivalDetailField : styles.paidIntervalDateField}
            label="Дата начала"
            name={[index, 'arrival_date']}
            getValueProps={getDateValue}
            getValueFromEvent={normalizeDateValue}
            rules={activeFromValidationRules(index)}
        >
            {isMobile ? (
                <MobileDateDrawer title="Дата начала" />
            ) : (
                <DatePicker
                    format={formDateFormat}
                    style={{ width: '100%' }}
                    onChange={createDateChange('arrival_date')}
                />
            )}
        </Form.Item>
    );

    const endDateField = (
        <Form.Item
            className={isMobile ? styles.arrivalDetailField : styles.paidIntervalDateField}
            label="Дата окончания"
            name={[index, 'departure_date']}
            getValueProps={getDateValue}
            getValueFromEvent={normalizeDateValue}
            rules={activeToValidationRules(index)}
        >
            {isMobile ? (
                <MobileDateDrawer title="Дата окончания" />
            ) : (
                <DatePicker
                    format={formDateFormat}
                    style={{ width: '100%' }}
                    onChange={createDateChange('departure_date')}
                />
            )}
        </Form.Item>
    );

    return (
        <div className={index !== 0 ? styles.arrivalBlockDivider : undefined}>
            <div className={styles.arrivalBlock}>
                <div className={isMobile ? styles.paidIntervalHeader : undefined}>
                    <h5 className={styles.paidIntervalSubtitle}>{intervalTitle}</h5>
                    {isMobile ? deleteButton : null}
                </div>
                {isMobile ? (
                    <>
                        {startDateField}
                        {endDateField}
                    </>
                ) : (
                    <div className={styles.paidIntervalRow}>
                        {startDateField}
                        {endDateField}
                        <div className={styles.paidIntervalDeleteCell}>{deleteButton}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
