import React from 'react';
import { Modal, Form, Select, InputNumber, Input, Button } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import type { ModalProps, FormInstance } from 'antd';
import type { ItemEntity } from 'interfaces';

interface CreatePositionModalProps {
    modalProps: ModalProps;
    formProps: { form?: FormInstance };
    storageId: number;
    binOptions: { label: string; value: number }[] | undefined;
    itemOptions: { label: string; value: number }[] | undefined;
    itemsData: ItemEntity[] | undefined;
    volunteerSelectProps: any;
    isVolunteerLoading: boolean;
    onOpenQrScanner: (form: FormInstance) => void;
}

export const CreatePositionModal: React.FC<CreatePositionModalProps> = ({
    modalProps,
    formProps,
    storageId,
    binOptions,
    itemOptions,
    itemsData,
    volunteerSelectProps,
    isVolunteerLoading,
    onOpenQrScanner
}) => {
    return (
        <Modal {...modalProps} title="Создать позицию">
            <Form {...formProps} layout="vertical">
                <Form.Item name="bin" label="Ячейка" rules={[{ required: true }]}>
                    <Select options={binOptions} />
                </Form.Item>
                <Form.Item name="item" label="Предмет" rules={[{ required: true }]}>
                    <Select
                        options={itemOptions}
                        showSearch
                        filterOption={(input, option) =>
                            ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(value) => {
                            const selectedItem = itemsData?.find((item: ItemEntity) => item.id === value);
                            if (selectedItem?.is_unique) {
                                formProps.form?.setFieldsValue({ count: 1 });
                            }
                        }}
                    />
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.item !== currentValues.item}>
                    {({ getFieldValue }) => {
                        const itemId = getFieldValue('item');
                        const selectedItem = itemsData?.find((item: ItemEntity) => item.id === itemId);
                        return selectedItem?.is_unique ? (
                            <Form.Item name="count" hidden initialValue={1}>
                                <InputNumber />
                            </Form.Item>
                        ) : (
                            <Form.Item name="count" label="Количество" rules={[{ required: true }]}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        );
                    }}
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.item !== currentValues.item}>
                    {({ getFieldValue }) => {
                        const itemId = getFieldValue('item');
                        const selectedItem = itemsData?.find((item: ItemEntity) => item.id === itemId);
                        return (
                            <Form.Item
                                name="volunteer"
                                label="Владелец"
                                rules={[{ required: !selectedItem?.is_anonymous }]}
                            >
                                <Select
                                    {...volunteerSelectProps}
                                    showSearch
                                    allowClear={selectedItem?.is_anonymous}
                                    filterOption={(input, option) =>
                                        ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    suffixIcon={
                                        <Button
                                            type="text"
                                            icon={<QrcodeOutlined />}
                                            onClick={() => {
                                                onOpenQrScanner(formProps.form!);
                                            }}
                                        />
                                    }
                                    loading={isVolunteerLoading}
                                />
                            </Form.Item>
                        );
                    }}
                </Form.Item>
                <Form.Item name="description" label="Описание">
                    <Input.TextArea />
                </Form.Item>
                <Form.Item name="storage" hidden initialValue={storageId}>
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};
