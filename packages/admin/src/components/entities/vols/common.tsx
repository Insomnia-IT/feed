import { Checkbox, DatePicker, Form, Input, Select, useSelect } from '@pankod/refine-antd';
import dynamic from 'next/dynamic';
import { Col, Row } from 'antd';

import { Rules } from '~/components/form';

// import { Rules } from '~/components/form';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';

import type { ColorTypeEntity, DepartmentEntity, FeedTypeEntity, KitchenEntity, VolEntity } from '~/interfaces';
import { apiDateFormat } from '~/shared/lib';

export const CreateEdit: FC = () => {
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
                                <Checkbox>Заблокирован</Checkbox>
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
                                <DatePicker format={apiDateFormat} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label='До' name='active_to' getValueProps={getDateValue} rules={Rules.required}>
                                <DatePicker format={apiDateFormat} style={{ width: '100%' }} />
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
                        <Input />
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
                        <Select mode='multiple' {...departmentSelectProps} />
                    </Form.Item>
                    <Form.Item label='Должность' name='position'>
                        <Input />
                    </Form.Item>
                    <Form.Item label='Цвет бейджика' name='color_type'>
                        <Select {...colorTypeSelectProps} />
                    </Form.Item>
                    <Form.Item label='Шеф' name='ref_to'>
                        <Select {...leadSelectProps} />
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
                    <Form.Item label='Номер бейджа' name='badge_number'>
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
};
