import React, { useState } from 'react';
import { useShow, useList, useSelect, type CrudFilter } from '@refinedev/core';
import { useSelect as useSelectAntd } from '@refinedev/antd';
import { Show, useModalForm } from '@refinedev/antd';
import type { FormInstance } from 'antd';
import {
    Typography,
    Tabs,
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Checkbox,
    Popconfirm,
    notification
} from 'antd';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    QrcodeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useDelete } from '@refinedev/core';
import type {
    StorageEntity,
    BinEntity,
    StorageItemPositionEntity,
    VolEntity,
    ItemEntity,
    ReceivingEntity,
    IssuanceEntity
} from 'interfaces';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';
import { useSearchVolunteer } from 'shared/hooks';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';

const { Text } = Typography;

export const StorageShow: React.FC = () => {
    const {
        result: storage,
        query: { isLoading: storageLoading }
    } = useShow<StorageEntity>();

    const filters: CrudFilter[] = [
        {
            field: 'storage',
            operator: 'eq',
            value: storage?.id
        }
    ];

    const {
        result: binsData,
        query: { isLoading: binsLoading, refetch: binsRefetch }
    } = useList<BinEntity>({
        resource: 'storage-bins',
        filters,
        queryOptions: { enabled: !!storage?.id }
    });

    const {
        result: itemsData,
        query: { isLoading: itemsLoading, refetch: itemsRefetch }
    } = useList<ItemEntity>({
        resource: 'storage-items'
    });

    const {
        result: positionsResult,
        query: { isLoading: positionsLoading, refetch: positionsRefetch }
    } = useList<StorageItemPositionEntity>({
        resource: 'storage-positions',
        filters,
        queryOptions: { enabled: !!storage?.id }
    });
    const positionsData = positionsResult;

    const {
        result: receivingsData,
        query: { isLoading: receivingsLoading, refetch: receivingsRefetch }
    } = useList<ReceivingEntity>({
        resource: 'storage-receivings',
        filters: [
            {
                field: 'position__storage',
                operator: 'eq',
                value: storage?.id
            }
        ],
        queryOptions: { enabled: !!storage?.id }
    });

    const {
        result: issuancesResult,
        query: { isLoading: issuancesLoading, refetch: issuancesRefetch }
    } = useList<IssuanceEntity>({
        resource: 'storage-issuances',
        filters: [
            {
                field: 'position__storage',
                operator: 'eq',
                value: storage?.id
            }
        ],
        queryOptions: { enabled: !!storage?.id }
    });
    const issuancesData = issuancesResult;

    const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
    const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<StorageItemPositionEntity | null>(null);

    const [actionForm] = Form.useForm();
    const { mutate: deleteMutate } = useDelete();

    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [currentForm, setCurrentForm] = useState<FormInstance | null>(null);
    const [scannedQr, setScannedQr] = useState<string | undefined>();

    const { data: scannedVolunteer, isLoading: isVolunteerLoading } = useSearchVolunteer(scannedQr);

    React.useEffect(() => {
        if (scannedVolunteer && currentForm) {
            currentForm.setFieldValue('volunteer', scannedVolunteer.id);
            setScannedQr(undefined);
            setIsQrModalOpen(false);
            notification.success({ message: `Волонтер найден: ${scannedVolunteer.name}` });
        }
    }, [scannedVolunteer, currentForm]);

    const { selectProps: volunteerSelectProps } = useSelectAntd<VolEntity>({
        resource: 'volunteers',
        optionLabel: formatVolunteerLabel,
        onSearch: (value) => [
            {
                field: 'search',
                operator: 'eq',
                value: value
            }
        ],
        defaultValue: scannedVolunteer?.id
    });

    const handleOpenQrScanner = (form: FormInstance) => {
        setCurrentForm(form);
        setScannedQr(undefined);
        setIsQrModalOpen(true);
    };

    const handleQrScan = (qr: string) => {
        setScannedQr(qr);
    };

    const {
        modalProps: binModalProps,
        formProps: binFormProps,
        show: showBinModal
    } = useModalForm<BinEntity>({
        resource: 'storage-bins',
        action: 'create',
        onMutationSuccess: () => {
            binsRefetch();
        }
    });

    const {
        modalProps: positionModalProps,
        formProps: positionFormProps,
        show: showPositionModal
    } = useModalForm<StorageItemPositionEntity>({
        resource: 'storage-positions',
        action: 'create',
        onMutationSuccess: () => {
            positionsRefetch();
            receivingsRefetch();
        }
    });

    React.useEffect(() => {
        if (storage?.id) {
            binFormProps.form?.setFieldsValue({ storage: storage.id });
            positionFormProps.form?.setFieldsValue({ storage: storage.id });
        }
    }, [storage?.id, binFormProps.form, positionFormProps.form]);

    const {
        modalProps: itemModalProps,
        formProps: itemFormProps,
        show: showItemModal
    } = useModalForm<ItemEntity>({
        resource: 'storage-items',
        action: 'create',
        onMutationSuccess: () => {
            itemsRefetch();
        }
    });

    const {
        modalProps: editItemModalProps,
        formProps: editItemFormProps,
        show: showEditItemModal
    } = useModalForm<ItemEntity>({
        resource: 'storage-items',
        action: 'edit',
        onMutationSuccess: () => {
            itemsRefetch();
        }
    });

    const { options: itemOptions } = useSelect<ItemEntity>({
        resource: 'storage-items',
        optionLabel: 'name'
    });

    const { options: binOptions } = useSelect<BinEntity>({
        resource: 'storage-bins',
        optionLabel: 'name',
        filters: filters
    });

    const handleAction = async (action: 'receive' | 'issue') => {
        try {
            const values = await actionForm.validateFields();
            const apiUrl = (window as any)._env_?.VITE_NEW_API_URL || 'http://localhost:8000/feedapi/v1';
            const token = Cookies.get('auth');

            await axios.post(`${apiUrl}/storage-positions/${selectedPosition?.id}/${action}/`, values, {
                headers: {
                    Authorization: token?.startsWith('V-TOKEN ') ? token : `Token ${token}`
                }
            });

            notification.success({ message: 'Успешно' });
            setIsReceiveModalVisible(false);
            setIsIssueModalVisible(false);
            actionForm.resetFields();
            positionsRefetch();
            receivingsRefetch();
            issuancesRefetch();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Ошибка при выполнении операции' });
        }
    };

    const columnsPositions = [
        { dataIndex: 'id', title: 'ID' },
        { dataIndex: 'bin_name', title: 'Ячейка' },
        { dataIndex: 'item_name', title: 'Предмет' },
        { dataIndex: 'count', title: 'Кол-во' },
        {
            title: 'Действия',
            render: (_: any, record: StorageItemPositionEntity) => (
                <Space>
                    <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => {
                            setSelectedPosition(record);
                            setIsReceiveModalVisible(true);
                        }}
                    >
                        Принять
                    </Button>
                    <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={record.item_is_unique && record.count === 0}
                        onClick={() => {
                            setSelectedPosition(record);
                            setIsIssueModalVisible(true);
                        }}
                    >
                        Выдать
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <Show isLoading={storageLoading} title={`Склад: ${storage?.name}`}>
            <div style={{ marginBottom: 24 }}>
                <Text type="secondary">{storage?.description}</Text>
            </div>

            <Tabs defaultActiveKey="positions">
                <Tabs.TabPane tab="Позиции" key="positions">
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showPositionModal()}>
                            Принять
                        </Button>
                    </div>
                    <Table
                        dataSource={positionsData?.data as any}
                        columns={columnsPositions}
                        rowKey="id"
                        loading={positionsLoading}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Ячейки" key="bins">
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showBinModal()}>
                            Добавить ячейку
                        </Button>
                    </div>
                    <Table
                        dataSource={binsData?.data as any}
                        rowKey="id"
                        loading={binsLoading}
                        columns={[
                            { dataIndex: 'name', title: 'Название' },
                            { dataIndex: 'capacity', title: 'Вместимость' },
                            { dataIndex: 'description', title: 'Описание' }
                        ]}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Предметы" key="items">
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showItemModal()}>
                            Добавить предмет
                        </Button>
                    </div>
                    <Table
                        dataSource={itemsData?.data as any}
                        rowKey="id"
                        loading={itemsLoading}
                        columns={[
                            { dataIndex: 'name', title: 'Название' },
                            { dataIndex: 'sku', title: 'Артикул / SKU' },
                            {
                                dataIndex: 'is_unique',
                                title: 'Уникальный',
                                render: (val) => (val ? 'Да' : 'Нет')
                            },
                            {
                                dataIndex: 'is_anonymous',
                                title: 'Анонимный',
                                render: (val) => (val ? 'Да' : 'Нет')
                            },
                            {
                                title: 'Действия',
                                render: (_, record: ItemEntity) => (
                                    <Space>
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => showEditItemModal(record.id)}
                                        />
                                        <Popconfirm
                                            title="Удалить предмет?"
                                            onConfirm={() => {
                                                deleteMutate(
                                                    {
                                                        resource: 'storage-items',
                                                        id: record.id
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                            itemsRefetch();
                                                        }
                                                    }
                                                );
                                            }}
                                        >
                                            <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </Space>
                                )
                            }
                        ]}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Приемка" key="receivings">
                    <Table
                        dataSource={receivingsData?.data as any}
                        rowKey="id"
                        loading={receivingsLoading}
                        columns={[
                            { dataIndex: 'id', title: 'ID' },
                            { dataIndex: 'item_name', title: 'Предмет' },
                            { dataIndex: 'count', title: 'Кол-во' },
                            { dataIndex: 'volunteer_name', title: 'От кого' },
                            { dataIndex: 'notes', title: 'Заметки' },
                            {
                                dataIndex: 'created_at',
                                title: 'Дата',
                                render: (val) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
                            }
                        ]}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Выдача" key="issuances">
                    <Table
                        dataSource={issuancesData?.data as any}
                        rowKey="id"
                        loading={issuancesLoading}
                        columns={[
                            { dataIndex: 'id', title: 'ID' },
                            { dataIndex: 'item_name', title: 'Предмет' },
                            { dataIndex: 'count', title: 'Кол-во' },
                            { dataIndex: 'volunteer_name', title: 'Кому' },
                            { dataIndex: 'notes', title: 'Заметки' },
                            {
                                dataIndex: 'created_at',
                                title: 'Дата',
                                render: (val) => (val ? new Date(val).toLocaleString('ru-RU') : '-')
                            }
                        ]}
                    />
                </Tabs.TabPane>
            </Tabs>

            <Modal
                title={`Принять предмет: ${selectedPosition?.item_name}`}
                open={isReceiveModalVisible}
                onOk={() => handleAction('receive')}
                onCancel={() => setIsReceiveModalVisible(false)}
            >
                <Form form={actionForm} layout="vertical">
                    {!selectedPosition?.item_is_unique && (
                        <Form.Item name="count" label="Количество" rules={[{ required: true }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                    )}
                    {selectedPosition?.item_is_unique && (
                        <Form.Item name="count" hidden initialValue={1}>
                            <InputNumber />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="volunteer"
                        label="От кого"
                        rules={[{ required: !selectedPosition?.item_is_anonymous }]}
                    >
                        <Select
                            {...volunteerSelectProps}
                            showSearch
                            allowClear={selectedPosition?.item_is_anonymous}
                            suffixIcon={
                                <Button
                                    type="text"
                                    icon={<QrcodeOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenQrScanner(actionForm);
                                    }}
                                />
                            }
                            loading={isVolunteerLoading}
                        />
                    </Form.Item>
                    <Form.Item name="notes" label="Заметки">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Выдать предмет: ${selectedPosition?.item_name}`}
                open={isIssueModalVisible}
                onOk={() => handleAction('issue')}
                onCancel={() => setIsIssueModalVisible(false)}
            >
                <Form form={actionForm} layout="vertical">
                    {!selectedPosition?.item_is_unique && (
                        <Form.Item name="count" label="Количество" rules={[{ required: true }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                    )}
                    {selectedPosition?.item_is_unique && (
                        <Form.Item name="count" hidden initialValue={1}>
                            <InputNumber />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="volunteer"
                        label="Кому"
                        rules={[{ required: !selectedPosition?.item_is_anonymous }]}
                    >
                        <Select
                            {...volunteerSelectProps}
                            showSearch
                            allowClear={selectedPosition?.item_is_anonymous}
                            suffixIcon={
                                <Button
                                    type="text"
                                    icon={<QrcodeOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenQrScanner(actionForm);
                                    }}
                                />
                            }
                            loading={isVolunteerLoading}
                        />
                    </Form.Item>
                    <Form.Item name="notes" label="Заметки">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal {...binModalProps} title="Создать ячейку">
                <Form {...binFormProps} layout="vertical">
                    <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="capacity" label="Вместимость">
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="description" label="Описание">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="storage" hidden initialValue={storage?.id}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal {...positionModalProps} title="Создать позицию">
                <Form {...positionFormProps} layout="vertical">
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
                                const selectedItem = itemsData.data?.find((item: ItemEntity) => item.id === value);
                                if (selectedItem?.is_unique) {
                                    positionFormProps.form?.setFieldsValue({ count: 1 });
                                }
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.item !== currentValues.item}
                    >
                        {({ getFieldValue }) => {
                            const itemId = getFieldValue('item');
                            const selectedItem = itemsData.data?.find((item: ItemEntity) => item.id === itemId);
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
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.item !== currentValues.item}
                    >
                        {({ getFieldValue }) => {
                            const itemId = getFieldValue('item');
                            const selectedItem = itemsData.data?.find((item: ItemEntity) => item.id === itemId);
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
                                            ((option?.label as string) ?? '')
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
                                        suffixIcon={
                                            <Button
                                                type="text"
                                                icon={<QrcodeOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenQrScanner(positionFormProps.form!);
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
                    <Form.Item name="storage" hidden initialValue={storage?.id}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal {...itemModalProps} title="Создать предмет">
                <Form {...itemFormProps} layout="vertical">
                    <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="sku" label="Артикул / SKU">
                        <Input />
                    </Form.Item>
                    <Space size="large">
                        <Form.Item name="is_unique" valuePropName="checked">
                            <Checkbox>Уникальный</Checkbox>
                        </Form.Item>
                        <Form.Item name="is_anonymous" valuePropName="checked">
                            <Checkbox>Анонимный</Checkbox>
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>

            <Modal {...editItemModalProps} title="Редактировать предмет">
                <Form {...editItemFormProps} layout="vertical">
                    <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="sku" label="Артикул / SKU">
                        <Input />
                    </Form.Item>
                    <Space size="large">
                        <Form.Item name="is_unique" valuePropName="checked">
                            <Checkbox>Уникальный</Checkbox>
                        </Form.Item>
                        <Form.Item name="is_anonymous" valuePropName="checked">
                            <Checkbox>Анонимный</Checkbox>
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>

            <QRScannerModal open={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} onScan={handleQrScan} />
        </Show>
    );
};
