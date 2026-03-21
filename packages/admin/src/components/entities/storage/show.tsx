import { FC, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Checkbox,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Typography,
    message
} from 'antd';
import { Show, TextField, useSelect } from '@refinedev/antd';
import { useList, useShow } from '@refinedev/core';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import type {
    BinEntity,
    IssuanceEntity,
    ItemEntity,
    ReceivingEntity,
    StorageEntity,
    StorageItemPositionEntity,
    VolEntity
} from 'interfaces';
import { Rules } from 'components/form/rules';

const { Text, Title } = Typography;

type ActionMode = 'receive' | 'issue';

type PositionActionModalProps = {
    mode: ActionMode;
    open: boolean;
    position: StorageItemPositionEntity | null;
    onClose: () => void;
    onSuccess: () => void;
};

type BinCreateModalProps = {
    open: boolean;
    storageId: number;
    onClose: () => void;
    onSuccess: () => void;
};

type ItemCreateModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type PositionCreateModalProps = {
    open: boolean;
    storageId: number;
    binOptions: Array<{ label: string; value: number }>;
    itemOptions: Array<{ label: string; value: number }>;
    onClose: () => void;
    onSuccess: () => void;
};

type MovementCreateModalProps = {
    mode: ActionMode;
    open: boolean;
    positionOptions: Array<{ label: string; value: number }>;
    onClose: () => void;
    onSuccess: () => void;
};

const PositionActionModal: FC<PositionActionModalProps> = ({ mode, open, position, onClose, onSuccess }) => {
    const [form] = Form.useForm<{ volunteer: number; count: number; notes?: string }>();
    const [loading, setLoading] = useState(false);

    const { selectProps: volunteerSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            volunteer: undefined as unknown as number,
            count: 1,
            notes: ''
        });
    }, [form, open, position?.id]);

    const title = mode === 'receive' ? 'Поступление' : 'Выдача';
    const actionName = mode === 'receive' ? 'receive' : 'issue';

    const handleSubmit = async () => {
        if (!position) return;

        const values = await form.validateFields();
        setLoading(true);

        try {
            await axios.post(`${NEW_API_URL}/storage-positions/${position.id}/${actionName}/`, values);
            message.success(mode === 'receive' ? 'Поступление сохранено' : 'Выдача сохранена');
            onSuccess();
            onClose();
            form.resetFields();
        } catch {
            message.error(mode === 'receive' ? 'Не удалось сохранить поступление' : 'Не удалось сохранить выдачу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            onOk={() => void handleSubmit()}
            confirmLoading={loading}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Волонтер" name="volunteer" rules={Rules.required}>
                    <Select {...volunteerSelectProps} showSearch optionFilterProp="label" />
                </Form.Item>
                <Form.Item label="Количество" name="count" rules={Rules.required}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Комментарий" name="notes">
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const BinCreateModal: FC<BinCreateModalProps> = ({ open, storageId, onClose, onSuccess }) => {
    const [form] = Form.useForm<{ name: string; capacity?: number | null; description?: string }>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            name: '',
            capacity: undefined,
            description: ''
        });
    }, [form, open]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setLoading(true);

        try {
            await axios.post(`${NEW_API_URL}/storage-bins/`, {
                ...values,
                storage: storageId
            });
            message.success('Ячейка добавлена');
            onSuccess();
            onClose();
            form.resetFields();
        } catch {
            message.error('Не удалось добавить ячейку');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Добавить ячейку"
            open={open}
            onCancel={onClose}
            onOk={() => void handleSubmit()}
            confirmLoading={loading}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Название" name="name" rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label="Емкость" name="capacity">
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Описание" name="description">
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const ItemCreateModal: FC<ItemCreateModalProps> = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm<{ name: string; sku?: string; is_unique: boolean }>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            name: '',
            sku: '',
            is_unique: false
        });
    }, [form, open]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setLoading(true);

        try {
            await axios.post(`${NEW_API_URL}/storage-items/`, values);
            message.success('Предмет добавлен');
            onSuccess();
            onClose();
            form.resetFields();
        } catch {
            message.error('Не удалось добавить артикул');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Добавить артикул"
            open={open}
            onCancel={onClose}
            onOk={() => void handleSubmit()}
            confirmLoading={loading}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Название" name="name" rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label="SKU" name="sku">
                    <Input />
                </Form.Item>
                <Form.Item label="Уникальный" name="is_unique" valuePropName="checked">
                    <Checkbox />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const PositionCreateModal: FC<PositionCreateModalProps> = ({
    open,
    storageId,
    binOptions,
    itemOptions,
    onClose,
    onSuccess
}) => {
    const [form] = Form.useForm<{ bin: number; item: number; count: number; description?: string }>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            bin: undefined as unknown as number,
            item: undefined as unknown as number,
            count: 1,
            description: ''
        });
    }, [form, open]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setLoading(true);

        try {
            await axios.post(`${NEW_API_URL}/storage-positions/`, {
                ...values,
                storage: storageId
            });
            message.success('Позиция добавлена');
            onSuccess();
            onClose();
            form.resetFields();
        } catch {
            message.error('Не удалось добавить позицию');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Добавить позицию"
            open={open}
            onCancel={onClose}
            onOk={() => void handleSubmit()}
            confirmLoading={loading}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Ячейка" name="bin" rules={Rules.required}>
                    <Select options={binOptions} showSearch optionFilterProp="label" />
                </Form.Item>
                <Form.Item label="Артикул" name="item" rules={Rules.required}>
                    <Select options={itemOptions} showSearch optionFilterProp="label" />
                </Form.Item>
                <Form.Item label="Количество" name="count" rules={Rules.required}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Описание" name="description">
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const MovementCreateModal: FC<MovementCreateModalProps> = ({ mode, open, positionOptions, onClose, onSuccess }) => {
    const [form] = Form.useForm<{ position: number; volunteer: number; count: number; notes?: string }>();
    const [loading, setLoading] = useState(false);

    const { selectProps: volunteerSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            position: undefined as unknown as number,
            volunteer: undefined as unknown as number,
            count: 1,
            notes: ''
        });
    }, [form, open]);

    const title = mode === 'receive' ? 'Новое поступление' : 'Новая выдача';
    const actionName = mode === 'receive' ? 'receive' : 'issue';

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setLoading(true);

        try {
            await axios.post(`${NEW_API_URL}/storage-positions/${values.position}/${actionName}/`, {
                volunteer: values.volunteer,
                count: values.count,
                notes: values.notes
            });
            message.success(mode === 'receive' ? 'Поступление сохранено' : 'Выдача сохранена');
            onSuccess();
            onClose();
            form.resetFields();
        } catch {
            message.error(mode === 'receive' ? 'Не удалось сохранить поступление' : 'Не удалось сохранить выдачу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            onOk={() => void handleSubmit()}
            confirmLoading={loading}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Позиция" name="position" rules={Rules.required}>
                    <Select options={positionOptions} showSearch optionFilterProp="label" />
                </Form.Item>
                <Form.Item label="Волонтер" name="volunteer" rules={Rules.required}>
                    <Select {...volunteerSelectProps} showSearch optionFilterProp="label" />
                </Form.Item>
                <Form.Item label="Количество" name="count" rules={Rules.required}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Комментарий" name="notes">
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export const StorageShow: FC = () => {
    const { queryResult, showId } = useShow<StorageEntity>();
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const storageId = Number(showId);

    const { data: binsResponse, refetch: refetchBins } = useList<BinEntity>({
        resource: 'storage-bins',
        pagination: { pageSize: 0 }
    });
    const { data: itemsResponse, refetch: refetchItems } = useList<ItemEntity>({
        resource: 'storage-items',
        pagination: { pageSize: 0 }
    });
    const { data: positionsResponse, refetch: refetchPositions } = useList<StorageItemPositionEntity>({
        resource: 'storage-positions',
        pagination: { pageSize: 0 }
    });
    const { data: issuancesResponse, refetch: refetchIssuances } = useList<IssuanceEntity>({
        resource: 'storage-issuances',
        pagination: { pageSize: 0 }
    });
    const { data: receivingsResponse, refetch: refetchReceivings } = useList<ReceivingEntity>({
        resource: 'storage-receivings',
        pagination: { pageSize: 0 }
    });
    const { data: volunteersResponse } = useList<VolEntity>({
        resource: 'volunteers',
        pagination: { pageSize: 0 }
    });

    const bins = useMemo(() => binsResponse?.data ?? [], [binsResponse?.data]);
    const items = useMemo(() => itemsResponse?.data ?? [], [itemsResponse?.data]);
    const positions = useMemo(() => positionsResponse?.data ?? [], [positionsResponse?.data]);
    const issuances = useMemo(() => issuancesResponse?.data ?? [], [issuancesResponse?.data]);
    const receivings = useMemo(() => receivingsResponse?.data ?? [], [receivingsResponse?.data]);
    const volunteers = useMemo(() => volunteersResponse?.data ?? [], [volunteersResponse?.data]);

    const storageBins = useMemo(() => bins.filter((bin) => bin.storage === storageId), [bins, storageId]);
    const storagePositions = useMemo(
        () => positions.filter((position) => position.storage === storageId),
        [positions, storageId]
    );
    const positionIds = useMemo(() => new Set(storagePositions.map((position) => position.id)), [storagePositions]);
    const storageIssuances = useMemo(
        () => issuances.filter((issuance) => positionIds.has(issuance.position)),
        [issuances, positionIds]
    );
    const storageReceivings = useMemo(
        () => receivings.filter((receiving) => positionIds.has(receiving.position)),
        [receivings, positionIds]
    );

    const binById = useMemo(() => new Map(bins.map((bin) => [bin.id, bin])), [bins]);
    const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
    const volunteerById = useMemo(
        () => new Map(volunteers.map((volunteer) => [volunteer.id, volunteer])),
        [volunteers]
    );
    const positionById = useMemo(() => new Map(positions.map((position) => [position.id, position])), [positions]);

    const positionOptions = useMemo(
        () =>
            storagePositions.map((position) => {
                const item = itemById.get(position.item);
                const bin = binById.get(position.bin);

                return {
                    value: position.id,
                    label: `${item?.name || position.item} / ${bin?.name || position.bin} · ${position.count}`
                };
            }),
        [binById, itemById, storagePositions]
    );
    const binOptions = useMemo(() => storageBins.map((bin) => ({ value: bin.id, label: bin.name })), [storageBins]);
    const itemOptions = useMemo(() => items.map((item) => ({ value: item.id, label: item.name })), [items]);

    const [receivePosition, setReceivePosition] = useState<StorageItemPositionEntity | null>(null);
    const [issuePosition, setIssuePosition] = useState<StorageItemPositionEntity | null>(null);
    const [createBinOpen, setCreateBinOpen] = useState(false);
    const [createItemOpen, setCreateItemOpen] = useState(false);
    const [createPositionOpen, setCreatePositionOpen] = useState(false);
    const [createIssuanceOpen, setCreateIssuanceOpen] = useState(false);
    const [createReceivingOpen, setCreateReceivingOpen] = useState(false);

    const refreshAll = () => {
        void Promise.all([refetchBins(), refetchItems(), refetchPositions(), refetchIssuances(), refetchReceivings()]);
    };

    const formatDate = (value?: string | null) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Название</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>Описание</Title>
            <Text>{record?.description || '—'}</Text>

            <Tabs
                items={[
                    {
                        key: 'positions',
                        label: 'Позиции',
                        children: (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <Space>
                                    <Button type="primary" onClick={() => setCreatePositionOpen(true)}>
                                        Добавить позицию
                                    </Button>
                                </Space>
                                <Table dataSource={storagePositions} rowKey="id" pagination={false}>
                                    <Table.Column<StorageItemPositionEntity>
                                        title="Действия"
                                        dataIndex="actions"
                                        width={170}
                                        render={(_, record) => (
                                            <Space>
                                                <Button size="small" onClick={() => setReceivePosition(record)}>
                                                    Приход
                                                </Button>
                                                <Button size="small" onClick={() => setIssuePosition(record)}>
                                                    Выдача
                                                </Button>
                                            </Space>
                                        )}
                                    />
                                    <Table.Column<StorageItemPositionEntity>
                                        dataIndex="bin"
                                        title="Ячейка"
                                        render={(value) => <TextField value={binById.get(value)?.name || value} />}
                                    />
                                    <Table.Column<StorageItemPositionEntity>
                                        dataIndex="item"
                                        title="Артикул"
                                        render={(value) => {
                                            const item = itemById.get(value);
                                            return (
                                                <Space>
                                                    <TextField value={item?.name || value} />
                                                    {item?.is_unique && <Tag color="gold">unique</Tag>}
                                                </Space>
                                            );
                                        }}
                                    />
                                    <Table.Column<StorageItemPositionEntity>
                                        dataIndex="count"
                                        title="Количество"
                                        render={(value) => <TextField value={value} />}
                                    />
                                    <Table.Column<StorageItemPositionEntity>
                                        dataIndex="description"
                                        title="Описание"
                                        render={(value) => <TextField value={value || '—'} />}
                                    />
                                </Table>
                            </Space>
                        )
                    },
                    {
                        key: 'bins',
                        label: 'Ячейки',
                        children: (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <Space>
                                    <Button type="primary" onClick={() => setCreateBinOpen(true)}>
                                        Добавить ячейку
                                    </Button>
                                </Space>
                                <Table dataSource={storageBins} rowKey="id" pagination={false}>
                                    <Table.Column<BinEntity>
                                        dataIndex="name"
                                        title="Название"
                                        render={(value) => <TextField value={value} />}
                                    />
                                    <Table.Column<BinEntity>
                                        dataIndex="capacity"
                                        title="Емкость"
                                        render={(value) => <TextField value={value ?? '—'} />}
                                    />
                                    <Table.Column<BinEntity>
                                        dataIndex="description"
                                        title="Описание"
                                        render={(value) => <TextField value={value || '—'} />}
                                    />
                                </Table>
                            </Space>
                        )
                    },
                    {
                        key: 'items',
                        label: 'Артикулы',
                        children: (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <Space>
                                    <Button type="primary" onClick={() => setCreateItemOpen(true)}>
                                        Добавить артикул
                                    </Button>
                                </Space>
                                <Table dataSource={items} rowKey="id" pagination={false}>
                                    <Table.Column<ItemEntity>
                                        dataIndex="name"
                                        title="Название"
                                        render={(value) => <TextField value={value} />}
                                    />
                                    <Table.Column<ItemEntity>
                                        dataIndex="sku"
                                        title="SKU"
                                        render={(value) => <TextField value={value || '—'} />}
                                    />
                                    <Table.Column<ItemEntity>
                                        dataIndex="is_unique"
                                        title="Уникальный"
                                        render={(value) => <TextField value={value ? 'Да' : 'Нет'} />}
                                    />
                                    <Table.Column<ItemEntity>
                                        dataIndex="metadata"
                                        title="Metadata"
                                        render={(value) => <TextField value={value ? JSON.stringify(value) : '—'} />}
                                    />
                                </Table>
                            </Space>
                        )
                    },
                    {
                        key: 'issuances',
                        label: 'Выдачи',
                        children: (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <Space>
                                    <Button type="primary" onClick={() => setCreateIssuanceOpen(true)}>
                                        Добавить выдачу
                                    </Button>
                                </Space>
                                <Table dataSource={storageIssuances} rowKey="id" pagination={false}>
                                    <Table.Column<IssuanceEntity>
                                        dataIndex="position"
                                        title="Позиция"
                                        render={(value) => {
                                            const position = positionById.get(value);
                                            const item = position ? itemById.get(position.item) : undefined;
                                            const bin = position ? binById.get(position.bin) : undefined;
                                            return <TextField value={`${item?.name || value} / ${bin?.name || '—'}`} />;
                                        }}
                                    />
                                    <Table.Column<IssuanceEntity>
                                        dataIndex="volunteer"
                                        title="Волонтер"
                                        render={(value) => (
                                            <TextField value={volunteerById.get(value)?.name || value} />
                                        )}
                                    />
                                    <Table.Column<IssuanceEntity>
                                        dataIndex="count"
                                        title="Кол-во"
                                        render={(value) => <TextField value={value} />}
                                    />
                                    <Table.Column<IssuanceEntity>
                                        dataIndex="notes"
                                        title="Комментарий"
                                        render={(value) => <TextField value={value || '—'} />}
                                    />
                                    <Table.Column<IssuanceEntity>
                                        dataIndex="created_at"
                                        title="Дата"
                                        render={(value) => <TextField value={formatDate(value)} />}
                                    />
                                </Table>
                            </Space>
                        )
                    },
                    {
                        key: 'receivings',
                        label: 'Поступления',
                        children: (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <Space>
                                    <Button type="primary" onClick={() => setCreateReceivingOpen(true)}>
                                        Добавить поступление
                                    </Button>
                                </Space>
                                <Table dataSource={storageReceivings} rowKey="id" pagination={false}>
                                    <Table.Column<ReceivingEntity>
                                        dataIndex="position"
                                        title="Позиция"
                                        render={(value) => {
                                            const position = positionById.get(value);
                                            const item = position ? itemById.get(position.item) : undefined;
                                            const bin = position ? binById.get(position.bin) : undefined;
                                            return <TextField value={`${item?.name || value} / ${bin?.name || '—'}`} />;
                                        }}
                                    />
                                    <Table.Column<ReceivingEntity>
                                        dataIndex="volunteer"
                                        title="Волонтер"
                                        render={(value) => (
                                            <TextField value={volunteerById.get(value)?.name || value} />
                                        )}
                                    />
                                    <Table.Column<ReceivingEntity>
                                        dataIndex="count"
                                        title="Кол-во"
                                        render={(value) => <TextField value={value} />}
                                    />
                                    <Table.Column<ReceivingEntity>
                                        dataIndex="notes"
                                        title="Комментарий"
                                        render={(value) => <TextField value={value || '—'} />}
                                    />
                                    <Table.Column<ReceivingEntity>
                                        dataIndex="created_at"
                                        title="Дата"
                                        render={(value) => <TextField value={formatDate(value)} />}
                                    />
                                </Table>
                            </Space>
                        )
                    }
                ]}
            />

            <PositionActionModal
                mode="receive"
                open={!!receivePosition}
                position={receivePosition}
                onClose={() => setReceivePosition(null)}
                onSuccess={refreshAll}
            />
            <PositionActionModal
                mode="issue"
                open={!!issuePosition}
                position={issuePosition}
                onClose={() => setIssuePosition(null)}
                onSuccess={refreshAll}
            />

            <BinCreateModal
                open={createBinOpen}
                storageId={storageId}
                onClose={() => setCreateBinOpen(false)}
                onSuccess={refreshAll}
            />
            <ItemCreateModal open={createItemOpen} onClose={() => setCreateItemOpen(false)} onSuccess={refreshAll} />
            <PositionCreateModal
                open={createPositionOpen}
                storageId={storageId}
                binOptions={binOptions}
                itemOptions={itemOptions}
                onClose={() => setCreatePositionOpen(false)}
                onSuccess={refreshAll}
            />
            <MovementCreateModal
                mode="issue"
                open={createIssuanceOpen}
                positionOptions={positionOptions}
                onClose={() => setCreateIssuanceOpen(false)}
                onSuccess={refreshAll}
            />
            <MovementCreateModal
                mode="receive"
                open={createReceivingOpen}
                positionOptions={positionOptions}
                onClose={() => setCreateReceivingOpen(false)}
                onSuccess={refreshAll}
            />
        </Show>
    );
};
