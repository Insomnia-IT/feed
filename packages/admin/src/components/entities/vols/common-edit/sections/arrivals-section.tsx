import { DatePicker, Form, Select, Button } from 'antd';
import { type ReactNode, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { Rules } from 'components/form';
import { formDateFormat } from 'shared/lib';

import styles from '../../common.module.css';
import useCanAccess from '../../use-can-access';
import type { VolunteerStatus } from 'shared/constants/volunteer-status';
import {
    isVolunteerStatus,
    isVolunteerCompletedStatusValue,
    getVolunteerStatusOrder
} from 'shared/helpers/volunteer-status';

type StatusItem = { label: ReactNode; value: string; disabled?: boolean };

const isInsideOtherArrival = (
    otherArrival: {
        arrival_date?: string;
        departure_date?: string;
    },
    currentArrival: {
        arrival_date?: string;
        departure_date?: string;
    }
) => {
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

export const ArrivalsSection = ({
    statusesOptions,
    transportsOptions
}: {
    statusesOptions: { label: string; value: string }[];
    transportsOptions: { label: string; value: string }[];
}) => {
    const form = Form.useFormInstance();

    const canArrivedAssign = useCanAccess({ action: 'status_arrived_assign', resource: 'volunteers' });
    const canStartedAssign = useCanAccess({ action: 'status_started_assign', resource: 'volunteers' });

    const statusesOrder = useMemo<ReadonlyArray<VolunteerStatus>>(
        () => getVolunteerStatusOrder(canArrivedAssign),
        [canArrivedAssign]
    );

    const statusesOptionsNew: StatusItem[] = (statusesOptions ?? [])
        .slice()
        .sort((a, b) => {
            const ai = isVolunteerStatus(a.value) ? statusesOrder.indexOf(a.value) : Number.MAX_SAFE_INTEGER;
            const bi = isVolunteerStatus(b.value) ? statusesOrder.indexOf(b.value) : Number.MAX_SAFE_INTEGER;
            return ai - bi;
        })
        .map((item) => {
            if (!isVolunteerStatus(item.value)) return { ...item, disabled: true };

            const inOrder = statusesOrder.includes(item.value);
            const allowedByPerm =
                (item.value !== 'ARRIVED' || canArrivedAssign) && (item.value !== 'STARTED' || canStartedAssign);

            const disabled = !(inOrder && allowedByPerm);

            const withCheck = isVolunteerCompletedStatusValue(item.value)
                ? { ...item, label: `✅ ${item.label}` }
                : item;

            return { ...withCheck, disabled };
        });

    const activeFromValidationRules = useCallback(
        (index: number) => [
            { required: true },
            {
                validator: async (_: unknown, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const arrivals = form.getFieldValue('arrivals') as {
                        arrival_date?: string;
                        departure_date?: string;
                    }[];

                    const otherArrivals = arrivals.filter((_, ind) => ind !== index);
                    const targetArrival = arrivals[index];

                    const arrivalDates = arrivals
                        .slice()
                        .map((arrival) => dayjs(arrival.arrival_date).format('YYYY-MM-DD'));

                    arrivalDates.splice(index, 1);

                    if (arrivalDates.includes(dayjs(value).format('YYYY-MM-DD'))) {
                        return Promise.reject(new Error('Дата заезда не должна повторяться'));
                    }

                    if (otherArrivals.some((otherArrival) => isInsideOtherArrival(otherArrival, targetArrival))) {
                        return Promise.reject(new Error('Даты заездов не должны пересекаться'));
                    }

                    return Promise.resolve();
                }
            }
        ],
        [form]
    );

    const activeToValidationRules = useCallback(
        (index: number) => [
            { required: true },
            {
                validator: async (_: unknown, value: string | number | Date) => {
                    const arrivalDate = form.getFieldValue(['arrivals', index, 'arrival_date']);

                    const arrivals = form.getFieldValue('arrivals') as {
                        arrival_date?: string;
                        departure_date?: string;
                    }[];

                    const otherArrivals = arrivals.filter((_, ind) => ind !== index);
                    const targetArrival = arrivals[index];

                    if (otherArrivals.some((otherArrival) => isInsideOtherArrival(otherArrival, targetArrival))) {
                        return Promise.reject(new Error('Даты заездов не должны пересекаться'));
                    }

                    if (dayjs(value) >= dayjs(arrivalDate)) {
                        return Promise.resolve();
                    }

                    return Promise.reject(new Error('Дата заезда не может быть раньше Даты отъезда'));
                }
            }
        ],
        [form]
    );

    return (
        <>
            <p className={styles.formSection__title}>Даты на поле</p>

            <Form.List name="arrivals">
                {(arrivalFields, { add, remove }) => {
                    const addArrival = () => {
                        add({
                            id: uuidv4(),
                            arrival_transport: 'UNDEFINED',
                            departure_transport: 'UNDEFINED'
                        });
                    };
                    return (
                        <>
                            <div>
                                {arrivalFields?.map((arrivalField, index) => (
                                    <ArrivalItem
                                        key={arrivalField.key}
                                        index={index}
                                        remove={remove}
                                        isSingle={arrivalFields.length === 1}
                                        statusesOptions={statusesOptionsNew}
                                        transportsOptions={transportsOptions}
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
                                onClick={addArrival}
                            >
                                Добавить заезд
                            </Button>
                        </>
                    );
                }}
            </Form.List>
        </>
    );
};

function ArrivalItem({
    index,
    isSingle,
    remove,
    statusesOptions,
    transportsOptions,
    activeFromValidationRules,
    activeToValidationRules
}: {
    index: number;
    isSingle: boolean;
    remove: (index: number) => void;
    statusesOptions: StatusItem[];
    transportsOptions: { label: string; value: string }[];
    activeFromValidationRules: (index: number) => Array<
        | { required: boolean }
        | {
              validator: (
                  rule: unknown,
                  value: string | number | Date | dayjs.Dayjs | null | undefined
              ) => Promise<void>;
          }
    >;
    activeToValidationRules: (
        index: number
    ) => Array<{ required: boolean } | { validator: (rule: unknown, value: string | number | Date) => Promise<void> }>;
}) {
    const form = Form.useFormInstance();

    const createDateChange = (fieldName: string) => (value: string | number | Date) => {
        const normalizedValue = dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;
        form.setFieldValue(['arrivals', index, fieldName], normalizedValue);
    };

    const deleteArrival = () => {
        remove(index);
    };

    const getDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) => ({
        value: value ? dayjs(value) : undefined
    });

    const renderLabel = (props: { label: ReactNode; value: string | number }): ReactNode => {
        if (!props.label) {
            return statusesOptions.find((item) => item.value === props.value)?.label;
        }
        return props.label;
    };

    const filteredStatusesOptions = useMemo(() => statusesOptions.filter((item) => !item.disabled), [statusesOptions]);

    return (
        <div className={index !== 0 ? `${styles.dateWrapper}` : ''}>
            <div className={styles.dateWrap}>
                <div className={styles.dateLabel}>
                    <div>Заезд {index + 1}</div>
                    <Button
                        className={styles.deleteButton}
                        danger
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={deleteArrival}
                        style={{
                            visibility: isSingle ? 'hidden' : undefined
                        }}
                    >
                        Удалить
                    </Button>
                </div>
                <div className={styles.dateInput}>
                    <Form.Item label="Статус заезда" name={[index, 'status']} rules={Rules.required}>
                        <Select options={filteredStatusesOptions} style={{ width: '100%' }} labelRender={renderLabel} />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.dateWrap}>
                <div className={`${styles.dateLabel} ${styles.dateLabelEmpty}`} style={{ visibility: 'hidden' }}>
                    <div>Заезд {index + 1}</div>
                    <Button
                        className={styles.deleteButton}
                        danger
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={deleteArrival}
                    >
                        Удалить
                    </Button>
                </div>
                <div className={styles.dateInput}>
                    <Form.Item
                        label="Дата заезда"
                        name={[index, 'arrival_date']}
                        getValueProps={getDateValue}
                        rules={activeFromValidationRules(index)}
                    >
                        <DatePicker
                            format={formDateFormat}
                            style={{ width: '100%' }}
                            onChange={createDateChange('arrival_date')}
                        />
                    </Form.Item>
                </div>
                <div className={styles.dateInput}>
                    <Form.Item label="Как добрался?" name={[index, 'arrival_transport']} rules={Rules.required}>
                        <Select options={transportsOptions} style={{ width: '100%' }} />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.dateWrap}>
                <div className={`${styles.dateLabel} ${styles.dateLabelEmpty}`} style={{ visibility: 'hidden' }}>
                    <div>Заезд {index + 1}</div>
                    <Button className={styles.deleteButton} danger type="link" icon={<DeleteOutlined />}>
                        Удалить
                    </Button>
                </div>
                <div className={styles.dateInput}>
                    <Form.Item
                        label="Дата отъезда"
                        name={[index, 'departure_date']}
                        getValueProps={getDateValue}
                        rules={activeToValidationRules(index)}
                    >
                        <DatePicker
                            format={formDateFormat}
                            style={{ width: '100%' }}
                            onChange={createDateChange('departure_date')}
                        />
                    </Form.Item>
                </div>
                <div className={styles.dateInput}>
                    <Form.Item label="Как уехал?" name={[index, 'departure_transport']} rules={Rules.required}>
                        <Select options={transportsOptions} style={{ width: '100%' }} />
                    </Form.Item>
                </div>
            </div>
        </div>
    );
}
