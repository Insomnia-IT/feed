import { DatePicker, Form, Select, Button } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';
import type { ArrivalEntity } from 'interfaces';
import { formDateFormat } from 'shared/lib';
import { getSorter } from 'utils';

import styles from '../../common.module.css';

export const ArrivalsSection = ({
    statusesOptions,
    transportsOptions
}: {
    statusesOptions: { label: string; value: string }[];
    transportsOptions: { label: string; value: string }[];
}) => {
    const form = Form.useFormInstance();
    const arrivals = Form.useWatch<Array<ArrivalEntity>>('arrivals', form);
    const [updatedArrivals, setUpdatedArrivals] = useState<Array<UpdatedArrival>>([]);

    const statusesOptionsNew =
        statusesOptions?.map((item) =>
            ['ARRIVED', 'STARTED', 'JOINED'].includes(item.value as string)
                ? { ...item, label: `✅ ${item.label}` }
                : item
        ) || [];

    useEffect(() => {
        if (!arrivals) return;
        setUpdatedArrivals(
            arrivals
                .slice()
                .sort(getSorter('arrival_date'))
                .map((arr) => ({ ...arr }))
        );
    }, [arrivals]);

    useEffect(() => {
        form.setFieldValue('updated_arrivals', updatedArrivals);
    }, [updatedArrivals, form]);

    const addArrival = () => {
        setUpdatedArrivals((prev) => [
            ...prev,
            {
                id: uuidv4(),
                arrival_transport: 'UNDEFINED',
                departure_transport: 'UNDEFINED'
            }
        ]);
    };

    const activeFromValidationRules = useCallback(
        (index: number) => [
            {
                required: true
            },
            {
                validator: async (_: any, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const arrivalDates = form
                        .getFieldValue('updated_arrivals')
                        .slice()
                        .map((a: { arrival_date: dayjs.Dayjs }) => dayjs(a.arrival_date).format('YYYY-MM-DD'));
                    arrivalDates.splice(index, 1);

                    if (arrivalDates.includes(dayjs(value).format('YYYY-MM-DD'))) {
                        return Promise.reject(new Error('Дата заезда не должна повторяться'));
                    }

                    return Promise.resolve();
                }
            }
        ],
        [form]
    );

    const activeToValidationRules = useCallback(
        (index: number) => [
            {
                required: true
            },
            {
                validator: async (_: any, value: string | number | Date) => {
                    const arrivalDate = form.getFieldValue(['updated_arrivals', index, 'arrival_date']);
                    if (new Date(value) >= new Date(arrivalDate)) {
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
            <Form.Item name="arrivals" hidden />

            {updatedArrivals.map((arrival, index) => (
                <ArrivalItem
                    key={arrival.id}
                    arrival={arrival}
                    index={index}
                    updatedArrivals={updatedArrivals}
                    setUpdatedArrivals={setUpdatedArrivals}
                    statusesOptions={statusesOptionsNew}
                    transportsOptions={transportsOptions}
                    activeFromValidationRules={activeFromValidationRules}
                    activeToValidationRules={activeToValidationRules}
                />
            ))}
            <Button
                className={styles.addArrivalButton}
                type="primary"
                icon={<PlusSquareOutlined />}
                onClick={addArrival}
            >
                Добавить заезд
            </Button>
        </>
    );
};

type UpdatedArrival = Partial<ArrivalEntity> & Pick<ArrivalEntity, 'id'>;

function ArrivalItem({
    arrival,
    index,
    updatedArrivals,
    setUpdatedArrivals,
    statusesOptions,
    transportsOptions,
    activeFromValidationRules,
    activeToValidationRules
}: {
    arrival: UpdatedArrival;
    index: number;
    updatedArrivals: UpdatedArrival[];
    setUpdatedArrivals: React.Dispatch<React.SetStateAction<UpdatedArrival[]>>;
    statusesOptions: { label: string; value: string }[];
    transportsOptions: { label: string; value: string }[];
    activeFromValidationRules: (index: number) => any[];
    activeToValidationRules: (index: number) => any[];
}) {
    const createChange = (fieldName: string) => (value: any) => {
        const newUpdaterdArrivals = updatedArrivals.slice();
        newUpdaterdArrivals[index] = {
            ...arrival,
            [fieldName]: value
        };
        setUpdatedArrivals(newUpdaterdArrivals);
    };

    const deleteArrival = () => {
        const newUpdatedArrivals = updatedArrivals.filter(({ id }) => id !== arrival.id);
        setUpdatedArrivals(newUpdatedArrivals);
    };

    const getDateValue = (value: string | number | Date | dayjs.Dayjs | null | undefined) => ({
        value: value ? dayjs(value) : ''
    });

    return (
        <>
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
                                visibility: updatedArrivals.length === 1 ? 'hidden' : undefined
                            }}
                        >
                            Удалить
                        </Button>
                    </div>
                    <div className={styles.dateInput}>
                        <Form.Item
                            label="Статус заезда"
                            name={['updated_arrivals', index, 'status']}
                            rules={Rules.required}
                        >
                            <Select
                                options={statusesOptions}
                                style={{ width: '100%' }}
                                onChange={createChange('status')}
                            />
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
                            name={['updated_arrivals', index, 'arrival_date']}
                            getValueProps={getDateValue}
                            rules={activeFromValidationRules(index)}
                        >
                            <DatePicker
                                format={formDateFormat}
                                style={{ width: '100%' }}
                                onChange={createChange('arrival_date')}
                            />
                        </Form.Item>
                    </div>
                    <div className={styles.dateInput}>
                        <Form.Item
                            label="Как добрался?"
                            name={['updated_arrivals', index, 'arrival_transport']}
                            rules={Rules.required}
                        >
                            <Select
                                options={transportsOptions}
                                style={{ width: '100%' }}
                                onChange={createChange('arrival_transport')}
                            />
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
                            name={['updated_arrivals', index, 'departure_date']}
                            getValueProps={getDateValue}
                            rules={activeToValidationRules(index)}
                        >
                            <DatePicker
                                format={formDateFormat}
                                style={{ width: '100%' }}
                                onChange={createChange('departure_date')}
                            />
                        </Form.Item>
                    </div>
                    <div className={styles.dateInput}>
                        <Form.Item
                            label="Как уехал?"
                            name={['updated_arrivals', index, 'departure_transport']}
                            rules={Rules.required}
                        >
                            <Select
                                options={transportsOptions}
                                style={{ width: '100%' }}
                                onChange={createChange('departure_transport')}
                            />
                        </Form.Item>
                    </div>
                </div>
            </div>
        </>
    );
}
