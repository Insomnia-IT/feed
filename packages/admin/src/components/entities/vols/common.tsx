import type { FormInstance } from '@pankod/refine-antd';
import { Checkbox, DatePicker, Form, Input, Modal, Select, useSelect } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';
import { Col, Row } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useCan } from '@pankod/refine-core';

import { Rules } from '~/components/form';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DepartmentEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    VolEntity
} from '~/interfaces';
import { formDateFormat } from '~/shared/lib';
import { dataProvider } from '~/dataProvider';

import useCanAccess from './use-can-access';

export const CreateEdit = ({ form }: { form: FormInstance }) => {
    const canFullEditing = useCanAccess({ action: 'full_edit', resource: 'volunteers' });
    const canEditGroupBadge = useCanAccess({ action: 'edit', resource: 'group-badges' });

    const { selectProps: leadSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'nickname'
    });

    const { selectProps: departmentSelectProps } = useSelect<DepartmentEntity>({
        resource: 'departments',
        optionLabel: 'name'
    });

    const { selectProps: kitchenSelectProps } = useSelect<KitchenEntity>({
        resource: 'kitchens',
        optionLabel: 'name'
    });

    const { selectProps: feedTypeSelectProps } = useSelect<FeedTypeEntity>({
        resource: 'feed-types',
        optionLabel: 'name'
    });

    const { selectProps: colorTypeSelectProps } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { selectProps: accessRoleSelectProps } = useSelect<AccessRoleEntity>({
        resource: 'access-roles',
        optionLabel: 'name'
    });

    const { selectProps: groupBadgeSelectProps } = useSelect<GroupBadgeEntity>({
        resource: 'group-badges',
        optionLabel: 'name'
    });

    const getDepartmentIds = (department) => {
        return {
            value: department ? department.map((d) => d.id || d) : department
        };
    };

    const getDateValue = (value) => {
        return {
            value: value ? dayjs(value) : ''
        };
    };

    const onGroupBadgeClear = () => {
        setTimeout(() => {
            form.setFieldValue('group_badge', '');
        });
    };

    const activeToValidationRules = useMemo(
        () => [
            {
                required: true
            },
            {
                validator: async (_, value) => {
                    if (new Date(value) >= new Date(form.getFieldValue('active_from'))) {
                        return Promise.resolve();
                    }

                    return Promise.reject(new Error("Дата 'До' не может быть меньше даты 'От'"));
                }
            }
        ],
        [form]
    );

    const [qrDuplicateVolunteer, setQrDuplicateVolunteer] = useState<VolEntity | null>(null);

    const checkQRDuplication = async (qr) => {
        const list = await dataProvider.getList<VolEntity>({
            filters: [{ field: 'qr', value: qr, operator: 'eq' }],
            resource: 'volunteers'
        });
        if (list.data.length && list.data[0].id !== form.getFieldValue('id')) {
            setQrDuplicateVolunteer(list.data[0]);
        }
    };

    const onQRChange = (e) => {
        const qr = e.target.value;
        if (qr) {
            void checkQRDuplication(qr);
        }
    };

    const clearDuplicateQR = async () => {
        if (qrDuplicateVolunteer) {
            await dataProvider.update<VolEntity>({
                id: qrDuplicateVolunteer.id,
                resource: 'volunteers',
                variables: {
                    qr: null
                }
            });
            setQrDuplicateVolunteer(null);
        }
    };

    const handleClear = () => {
        void clearDuplicateQR();
    };

    const handleOpenVolunteer = () => {
        if (qrDuplicateVolunteer) {
            window.location.href = `${window.location.origin}/volunteers/edit/${qrDuplicateVolunteer.id}`;
        }
    };

    const handleCancel = () => {
        setQrDuplicateVolunteer(null);
    };

    useEffect(() => {
        // @ts-ignore
        function onHardwareScan({ detail: { scanCode } }): void {
            form.setFieldValue('qr', scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        // @ts-ignore
        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            // @ts-ignore
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [form]);

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const loadCustomFields = async () => {
        const { data } = await dataProvider.getList<CustomFieldEntity>({
            resource: 'volunteer-custom-fields'
        });

        setCustomFields(data);
    };

    useEffect(() => {
        void loadCustomFields();
    }, []);

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item name='is_active' valuePropName='checked'>
                                <Checkbox>Активирован</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='is_blocked' valuePropName='checked'>
                                <Checkbox disabled={!canFullEditing}>Заблокирован</Checkbox>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label='Позывной' name='nickname' rules={Rules.required}>
                        <Input />
                    </Form.Item>
                    <Form.Item label='Имя' name='name'>
                        <Input />
                    </Form.Item>
                    <Form.Item label='Фамилия' name='lastname'>
                        <Input />
                    </Form.Item>
                    <Form.Item label='Телефон' name='phone'>
                        <Input type='phone' />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item></Form.Item>

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item
                                label='От'
                                name='active_from'
                                getValueProps={getDateValue}
                                rules={Rules.required}
                            >
                                <DatePicker format={formDateFormat} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='До'
                                name='active_to'
                                getValueProps={getDateValue}
                                rules={activeToValidationRules}
                            >
                                <DatePicker format={formDateFormat} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item label=' ' name='is_vegan' valuePropName='checked'>
                                <Checkbox>Веган</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label='Тип питания' name='feed_type' rules={Rules.required}>
                                <Select {...feedTypeSelectProps} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label='QR' name='qr' rules={Rules.required}>
                        <Input onChange={onQRChange} />
                    </Form.Item>
                    <Form.Item label='Кухня' name='kitchen' rules={Rules.required}>
                        <Select {...kitchenSelectProps} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item></Form.Item>
                    <Form.Item
                        label='Служба / Локация'
                        getValueProps={getDepartmentIds}
                        name='departments'
                        rules={Rules.required}
                    >
                        <Select disabled={!canFullEditing} mode='multiple' {...departmentSelectProps} />
                    </Form.Item>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item label='Должность' name='position'>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label='Роль' name='role'>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label='Цвет бейджика' name='color_type'>
                        <Select {...colorTypeSelectProps} />
                    </Form.Item>
                    <Form.Item label='Право доступа' name='access_role'>
                        <Select disabled={!canFullEditing} {...accessRoleSelectProps} />
                    </Form.Item>
                    <Form.Item label='Шеф' name='ref_to'>
                        {!leadSelectProps.loading && <Select {...leadSelectProps} />}
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={16}>
                    <Form.Item label='Комментарий' name='comment'>
                        <ReactQuill />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item label='Партия бейджа' name='printing_batch'>
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label='Номер бейджа' name='badge_number'>
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label='Групповой бейдж' name='group_badge'>
                        <Select disabled={canEditGroupBadge} allowClear {...groupBadgeSelectProps} onClear={onGroupBadgeClear} />
                    </Form.Item>
                    {customFields.map(({ id, name, type }) => {
                        const handleChange = (e) => {
                            const value = e.target[type === 'boolean' ? 'checked' : 'value'];
                            form.setFieldValue(['updated_custom_fields', id.toString()], value);
                        };
                        const customFieldValues = form.getFieldValue('custom_field_values');
                        if (!customFieldValues) return null;
                        const customFieldValue = customFieldValues.find(({ custom_field }) => custom_field === id);
                        return (
                            <Form.Item key={name} label={name}>
                                {type === 'boolean' && (
                                    <Checkbox
                                        defaultChecked={customFieldValue ? customFieldValue.value === 'true' : false}
                                        onChange={handleChange}
                                    />
                                )}
                                {type === 'string' && (
                                    <Input
                                        defaultValue={customFieldValue ? customFieldValue.value : ''}
                                        onChange={handleChange}
                                    />
                                )}
                            </Form.Item>
                        );
                    })}
                </Col>
            </Row>
            <Modal
                title='Дублирование QR'
                open={qrDuplicateVolunteer !== null && !qrDuplicateVolunteer.is_active}
                onOk={handleClear}
                onCancel={handleCancel}
                okText='Освободить'
            >
                <p>Этот QR уже привязан к другому волонтеру.</p>
                <p>Освободить этот QR код?</p>
            </Modal>
            <Modal
                title='Дублирование QR'
                open={qrDuplicateVolunteer !== null && qrDuplicateVolunteer.is_active}
                onOk={handleOpenVolunteer}
                onCancel={handleCancel}
                okText='Открыть'
            >
                <p>Этот QR уже привязан к активированному волонтеру.</p>
                <p>Открыть карточку этого волонтера?</p>
            </Modal>
        </>
    );
};
