import { Button, Checkbox, DatePicker, Form } from 'antd';
import { useCallback } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';
import { MobileDateDrawer } from 'shared/components/mobile-date-drawer/mobile-date-drawer';
import { formDateFormat } from 'shared/lib';
import { useScreen } from 'shared/providers';

import styles from '../../common.module.css';

type PaidArrivalInterval = {
    arrival_date?: string;
    departure_date?: string;
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

export const PaidArrivalsSection = ({ visible }: { visible: boolean }) => {
    const form = Form.useFormInstance();

    const activeFromValidationRules = useCallback(
        (index: number) => [
            ...Rules.required,
            {
                validator: async (_: unknown, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const paidArrivals = (form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalInterval[];
                    const targetArrival = paidArrivals[index];
                    const otherArrivals = paidArrivals.filter((_: unknown, ind: number) => ind !== index);

                    const arrivalDates = paidArrivals
                        .slice()
                        .map((arrival) => dayjs(arrival.arrival_date).format('YYYY-MM-DD'));

                    arrivalDates.splice(index, 1);

                    if (arrivalDates.includes(dayjs(value).format('YYYY-MM-DD'))) {
                        return Promise.reject(new Error('Дата начала не должна повторяться'));
                    }

                    if (otherArrivals.some((otherArrival) => isInsideOtherPaidArrival(otherArrival, targetArrival))) {
                        return Promise.reject(new Error('Интервалы платного питания не должны пересекаться'));
                    }

                    return Promise.resolve();
                }
            }
        ],
        [form]
    );

    const activeToValidationRules = useCallback(
        (index: number) => [
            ...Rules.required,
            {
                validator: async (_: unknown, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const arrivalDate = form.getFieldValue(['paid_arrivals', index, 'arrival_date']);
                    const paidArrivals = (form.getFieldValue('paid_arrivals') ?? []) as PaidArrivalInterval[];
                    const targetArrival = paidArrivals[index];
                    const otherArrivals = paidArrivals.filter((_: unknown, ind: number) => ind !== index);

                    if (otherArrivals.some((otherArrival) => isInsideOtherPaidArrival(otherArrival, targetArrival))) {
                        return Promise.reject(new Error('Интервалы платного питания не должны пересекаться'));
                    }

                    if (dayjs(value).isBefore(dayjs(arrivalDate))) {
                        return Promise.reject(new Error('Дата окончания не может быть раньше даты начала'));
                    }

                    return Promise.resolve();
                }
            }
        ],
        [form]
    );

    if (!visible) {
        return null;
    }

    return (
        <>
            <p className={styles.formSection__title}>Платное питание</p>

            <Form.List name="paid_arrivals">
                {(paidArrivalFields, { add, remove }) => {
                    const addPaidArrival = () => {
                        add({
                            id: uuidv4(),
                            is_free: false
                        });
                    };

                    return (
                        <>
                            <div>
                                {paidArrivalFields.map((paidArrivalField, index) => (
                                    <PaidArrivalItem
                                        key={paidArrivalField.key}
                                        index={index}
                                        remove={remove}
                                        activeFromValidationRules={activeFromValidationRules}
                                        activeToValidationRules={activeToValidationRules}
                                    />
                                ))}
                            </div>
                            <Button
                                key="add"
                                className={styles.addArrivalButton}
                                type="primary"
                                icon={<PlusSquareOutlined />}
                                onClick={addPaidArrival}
                            >
                                Добавить платное питание
                            </Button>
                        </>
                    );
                }}
            </Form.List>
        </>
    );
};

function PaidArrivalItem({
    index,
    remove,
    activeFromValidationRules,
    activeToValidationRules
}: {
    index: number;
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

    const createDateChange = (fieldName: string) => (value: string | number | Date | dayjs.Dayjs | null) => {
        const normalizedValue = dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;
        form.setFieldValue(['paid_arrivals', index, fieldName], normalizedValue);
    };

    const normalizeDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) =>
        dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;

    const getDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) => ({
        value: value ? dayjs(value) : undefined
    });

    return (
        <div className={index !== 0 ? styles.dateWrapper : ''}>
            <div className={styles.dateWrap}>
                <div className={styles.dateLabel}>
                    <div>Интервал {index + 1}</div>
                    <Button
                        className={styles.deleteButton}
                        danger
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(index)}
                    >
                        Удалить
                    </Button>
                </div>
                <div className={styles.dateInput}>
                    <Form.Item
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
                </div>
                <div className={styles.dateInput}>
                    <Form.Item
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
                </div>
                <div className={styles.dateInput}>
                    <Form.Item label="Бесплатно" name={[index, 'is_free']} valuePropName="checked">
                        <Checkbox />
                    </Form.Item>
                </div>
            </div>
        </div>
    );
}
