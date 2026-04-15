import { Checkbox, DatePicker, Form, Input, Select } from 'antd';
import { Create, useForm, useSelect } from '@refinedev/antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Dayjs } from 'dayjs';
import { ulid } from 'ulid';

import { MobileDateTimeDrawer } from 'shared/components/mobile-date-time-drawer/mobile-date-time-drawer';
import type { FeedTransactionEntity, KitchenEntity, VolEntity } from 'interfaces';
import { Rules } from 'components/form/rules';
import { useScreen } from 'shared/providers';

const mealTimeOptions = [
    { value: 'breakfast', label: 'Завтрак' },
    { value: 'lunch', label: 'Обед' },
    { value: 'dinner', label: 'Ужин' },
    { value: 'night', label: 'Дожор' }
];

const MOBILE_PICKER_LABEL = 'Выбрать дату и время';
const MOBILE_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

export const FeedTransactionCreate = () => {
    const { form, formProps, saveButtonProps } = useForm<FeedTransactionEntity>();
    const { isMobile } = useScreen();
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    const { selectProps: volSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });
    const { selectProps: kitchenSelectProps } = useSelect<KitchenEntity>({
        resource: 'kitchens',
        optionLabel: 'name'
    });

    useEffect(() => {
        form.setFieldsValue({ amount: 1, is_vegan: false });
    }, [form]);

    const dtimeValue = Form.useWatch('dtime', form) as Dayjs | undefined;

    const updateUlid = useCallback(
        (value: Dayjs | null) => form.setFieldValue('ulid', value ? ulid(value.valueOf()) : undefined),
        [form]
    );

    const mobilePickerValueLabel = useMemo(
        () => (dtimeValue ? dtimeValue.format(MOBILE_DATE_FORMAT) : MOBILE_PICKER_LABEL),
        [dtimeValue]
    );

    const openMobileDrawer = useCallback(() => {
        setIsMobileDrawerOpen(true);
    }, []);

    const closeMobileDrawer = useCallback(() => {
        setIsMobileDrawerOpen(false);
    }, []);

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="id" name="ulid" hidden>
                    <Input />
                </Form.Item>

                {isMobile ? (
                    <>
                        <Form.Item name="dtime" rules={Rules.required} hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item shouldUpdate noStyle>
                            {() => {
                                const dtimeErrors = form.getFieldError('dtime');

                                return (
                                    <Form.Item
                                        label="Время"
                                        required
                                        validateStatus={dtimeErrors.length ? 'error' : undefined}
                                        help={dtimeErrors[0]}
                                    >
                                        <MobileDateTimeDrawer
                                            title="Время"
                                            open={isMobileDrawerOpen}
                                            value={dtimeValue}
                                            onOpen={openMobileDrawer}
                                            onClose={closeMobileDrawer}
                                            onConfirm={(value) => {
                                                form.setFieldValue('dtime', value ?? undefined);
                                                updateUlid(value);
                                                void form.validateFields(['dtime']).catch(() => undefined);
                                                closeMobileDrawer();
                                            }}
                                            onReset={() => {
                                                form.setFieldValue('dtime', undefined);
                                                updateUlid(null);
                                                void form.validateFields(['dtime']).catch(() => undefined);
                                            }}
                                            triggerLabel={mobilePickerValueLabel}
                                            emptyLabel={MOBILE_PICKER_LABEL}
                                        />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>
                    </>
                ) : (
                    <Form.Item label="Время" name="dtime" rules={Rules.required}>
                        <DatePicker showTime style={{ width: '100%' }} onChange={(value) => updateUlid(value)} />
                    </Form.Item>
                )}

                <Form.Item label="Прием пищи" name="meal_time" rules={Rules.required}>
                    <Select options={mealTimeOptions} />
                </Form.Item>
                <Form.Item label="Волонтер" name="volunteer">
                    <Select {...volSelectProps} />
                </Form.Item>
                <Form.Item label="Веган" name="is_vegan" valuePropName="checked">
                    <Checkbox />
                </Form.Item>
                <Form.Item label="Кол-во" name="amount" rules={Rules.required}>
                    <Input type="number" />
                </Form.Item>
                <Form.Item label="Кухня" name="kitchen" rules={Rules.required}>
                    <Select {...kitchenSelectProps} />
                </Form.Item>
            </Form>
        </Create>
    );
};
