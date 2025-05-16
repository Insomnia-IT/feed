import { DatePicker, Form, Select, Button } from 'antd';
import { useCallback } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';
import { formDateFormat } from 'shared/lib';

import styles from '../../common.module.css';

export const ArrivalsSection = ({
    statusesOptions,
    transportsOptions
}: {
    statusesOptions: { label: string; value: string }[];
    transportsOptions: { label: string; value: string }[];
}) => {
    const form = Form.useFormInstance();

    const statusesOptionsNew =
        statusesOptions?.map((item) =>
            ['ARRIVED', 'STARTED', 'JOINED'].includes(item.value as string)
                ? { ...item, label: `✅ ${item.label}` }
                : item
        ) || [];

    const activeFromValidationRules = useCallback(
        (index: number) => [
            {
                required: true
            },
            {
                validator: async (_: unknown, value: string | number | Date | dayjs.Dayjs | null | undefined) => {
                    const arrivalDates = form
                        .getFieldValue('arrivals')
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
                validator: async (_: unknown, value: string | number | Date) => {
                    const arrivalDate = form.getFieldValue(['arrivals', index, 'arrival_date']);
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
    statusesOptions: { label: string; value: string }[];
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
                                visibility: isSingle ? 'hidden' : undefined
                            }}
                        >
                            Удалить
                        </Button>
                    </div>
                    <div className={styles.dateInput}>
                        <Form.Item label="Статус заезда" name={[index, 'status']} rules={Rules.required}>
                            <Select options={statusesOptions} style={{ width: '100%' }} />
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
        </>
    );
}
