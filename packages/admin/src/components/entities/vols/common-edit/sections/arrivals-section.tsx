import { DatePicker, Form, Select, Button } from 'antd';
import { type ReactNode, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { Rules } from 'components/form';
import { MobileDateDrawer } from 'shared/components/mobile-date-drawer/mobile-date-drawer';
import { createClientId, formDateFormat } from 'shared/lib';
import { useScreen } from 'shared/providers';

import styles from '../../common.module.css';
import useCanAccess from '../../use-can-access';
import type { VolunteerStatus } from 'shared/constants/volunteer-status';
import {
    isVolunteerStatus,
    isVolunteerCompletedStatusValue,
    getVolunteerStatusOrder
} from 'shared/helpers/volunteer-status';

type StatusItem = { label: ReactNode; value: string; disabled?: boolean };

type ArrivalDateInterval = {
    arrival_date?: string;
    departure_date?: string;
};

const parseArrivalInterval = (arrival: ArrivalDateInterval): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null => {
    if (!arrival.arrival_date || !arrival.departure_date) {
        return null;
    }

    const start = dayjs(arrival.arrival_date).startOf('day');
    const end = dayjs(arrival.departure_date).startOf('day');

    if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) {
        return null;
    }

    return { start, end };
};

const doArrivalIntervalsOverlap = (
    left: { start: dayjs.Dayjs; end: dayjs.Dayjs },
    right: { start: dayjs.Dayjs; end: dayjs.Dayjs }
): boolean => !left.start.isAfter(right.end, 'day') && !right.start.isAfter(left.end, 'day');

const hasArrivalOverlap = (targetArrival: ArrivalDateInterval, otherArrivals: ArrivalDateInterval[]): boolean => {
    const targetInterval = parseArrivalInterval(targetArrival);
    if (!targetInterval) {
        return false;
    }

    return otherArrivals.some((otherArrival) => {
        const otherInterval = parseArrivalInterval(otherArrival);
        if (!otherInterval) {
            return false;
        }

        return doArrivalIntervalsOverlap(targetInterval, otherInterval);
    });
};

export const ArrivalsSection = ({
    statusesOptions,
    transportsOptions
}: {
    statusesOptions: { label: string; value: string }[];
    transportsOptions: { label: string; value: string }[];
}) => {
    const form = Form.useFormInstance();
    const arrivalsValue = Form.useWatch('arrivals', form);
    const arrivalCount = Array.isArray(arrivalsValue) ? arrivalsValue.length : 0;
    const showSectionTitle = arrivalCount <= 1;

    const canArrivedAssign = useCanAccess({ action: 'status_arrived_assign', resource: 'volunteers' });
    const canStartedAssign = useCanAccess({ action: 'status_started_assign', resource: 'volunteers' });
    const accessRole = Form.useWatch('access_role', form);
    const canArrivedAssignForRole = canArrivedAssign && accessRole !== 'DIRECTION_HEAD';

    const statusesOrder = useMemo<ReadonlyArray<VolunteerStatus>>(
        () => getVolunteerStatusOrder(canArrivedAssignForRole),
        [canArrivedAssignForRole]
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
                (item.value !== 'ARRIVED' || canArrivedAssignForRole) && (item.value !== 'STARTED' || canStartedAssign);

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
                    const targetArrival: ArrivalDateInterval = {
                        ...arrivals[index],
                        arrival_date: value ? dayjs(value).format('YYYY-MM-DD') : arrivals[index]?.arrival_date
                    };

                    const arrivalDates = arrivals
                        .slice()
                        .map((arrival) => dayjs(arrival.arrival_date).format('YYYY-MM-DD'));

                    arrivalDates.splice(index, 1);

                    if (arrivalDates.includes(dayjs(value).format('YYYY-MM-DD'))) {
                        return Promise.reject(new Error('Дата заезда не должна повторяться'));
                    }

                    if (hasArrivalOverlap(targetArrival, otherArrivals)) {
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
                    const targetArrival: ArrivalDateInterval = {
                        ...arrivals[index],
                        departure_date: value ? dayjs(value).format('YYYY-MM-DD') : arrivals[index]?.departure_date
                    };

                    if (hasArrivalOverlap(targetArrival, otherArrivals)) {
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
            {showSectionTitle ? (
                <div className={styles.formSection__title}>
                    <h4>Заезд</h4>
                </div>
            ) : null}
            <Form.List name="arrivals">
                {(arrivalFields, { add, remove }) => {
                    const addArrival = () => {
                        add({
                            id: createClientId(),
                            arrival_transport: 'UNDEFINED',
                            departure_transport: 'UNDEFINED'
                        });
                    };
                    const isEmpty = arrivalFields.length === 0;
                    const isSingleArrival = arrivalFields.length === 1;

                    const addArrivalButton = (
                        <div className={styles.addArrivalActions}>
                            <Button
                                key="add"
                                color="primary"
                                variant="outlined"
                                icon={<PlusSquareOutlined />}
                                onClick={addArrival}
                            >
                                Добавить заезд
                            </Button>
                        </div>
                    );

                    return (
                        <>
                            {isEmpty ? (
                                <div className={styles.arrivalsEmptyState}>
                                    <p className={styles.arrivalsEmptyHint}>Вы ещё не добавили заездов.</p>
                                    {addArrivalButton}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        {arrivalFields.map((arrivalField, index) => (
                                            <ArrivalItem
                                                key={arrivalField.key}
                                                index={index}
                                                remove={remove}
                                                isSingle={isSingleArrival}
                                                statusesOptions={statusesOptionsNew}
                                                transportsOptions={transportsOptions}
                                                activeFromValidationRules={activeFromValidationRules}
                                                activeToValidationRules={activeToValidationRules}
                                            />
                                        ))}
                                    </div>
                                    {addArrivalButton}
                                </>
                            )}
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
    const { isMobile } = useScreen();

    const createDateChange = (fieldName: string) => (value: string | number | Date) => {
        const normalizedValue = dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;
        form.setFieldValue(['arrivals', index, fieldName], normalizedValue);
    };

    const normalizeDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) =>
        dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;

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
    const arrivalHeading = isSingle ? null : `Заезд ${index + 1}`;

    const deleteButton = !isSingle ? (
        <Button className={styles.deleteButton} danger type="link" icon={<DeleteOutlined />} onClick={deleteArrival}>
            Удалить
        </Button>
    ) : null;

    const statusField = (
        <Form.Item
            className={styles.arrivalStatusField}
            label="Статус заезда"
            name={[index, 'status']}
            rules={Rules.required}
        >
            <Select options={filteredStatusesOptions} labelRender={renderLabel} />
        </Form.Item>
    );

    const arrivalDateField = (
        <Form.Item
            className={styles.arrivalDetailField}
            label="Дата заезда"
            name={[index, 'arrival_date']}
            getValueProps={getDateValue}
            getValueFromEvent={normalizeDateValue}
            rules={activeFromValidationRules(index)}
        >
            {isMobile ? (
                <MobileDateDrawer title="Дата заезда" />
            ) : (
                <DatePicker
                    format={formDateFormat}
                    style={{ width: '100%' }}
                    onChange={createDateChange('arrival_date')}
                />
            )}
        </Form.Item>
    );

    const arrivalTransportField = (
        <Form.Item
            className={styles.arrivalDetailField}
            label="Как добрался?"
            name={[index, 'arrival_transport']}
            rules={Rules.required}
        >
            <Select options={transportsOptions} />
        </Form.Item>
    );

    const departureDateField = (
        <Form.Item
            className={styles.arrivalDetailField}
            label="Дата отъезда"
            name={[index, 'departure_date']}
            getValueProps={getDateValue}
            getValueFromEvent={normalizeDateValue}
            rules={activeToValidationRules(index)}
        >
            {isMobile ? (
                <MobileDateDrawer title="Дата отъезда" />
            ) : (
                <DatePicker
                    format={formDateFormat}
                    style={{ width: '100%' }}
                    onChange={createDateChange('departure_date')}
                />
            )}
        </Form.Item>
    );

    const departureTransportField = (
        <Form.Item
            className={styles.arrivalDetailField}
            label="Как уехал?"
            name={[index, 'departure_transport']}
            rules={Rules.required}
        >
            <Select options={transportsOptions} />
        </Form.Item>
    );

    return (
        <div className={index !== 0 ? styles.arrivalBlockDivider : undefined}>
            <div className={styles.arrivalBlock}>
                {isMobile ? (
                    <>
                        {arrivalHeading ? (
                            <div className={styles.arrivalBlockTitleRow}>
                                <div className={styles.formSection__title}>
                                    <h4>{arrivalHeading}</h4>
                                </div>
                                {deleteButton}
                            </div>
                        ) : null}
                        {statusField}
                        {arrivalDateField}
                        {arrivalTransportField}
                        {departureDateField}
                        {departureTransportField}
                    </>
                ) : (
                    <>
                        {arrivalHeading ? (
                            <div className={styles.arrivalBlockTitleRow}>
                                <div className={styles.formSection__title}>
                                    <h4>{arrivalHeading}</h4>
                                </div>
                                {deleteButton}
                            </div>
                        ) : null}
                        <div className={styles.arrivalFieldsGrid}>
                            {statusField}
                            {arrivalDateField}
                            {departureDateField}
                            {arrivalTransportField}
                            {departureTransportField}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
