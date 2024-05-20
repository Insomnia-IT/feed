import {
    Button,
    Edit,
    EditButton,
    Form,
    Space,
    Table,
    TextField,
    Typography,
    useForm,
    useTable,
    Modal
} from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList, useTranslate, useUpdateMany } from '@pankod/refine-core';
import { DeleteOutlined } from '@ant-design/icons';
import { Popconfirm, Input } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';

import 'react-mde/lib/styles/css/react-mde-all.css';

import { Key, useEffect, useMemo, useState } from 'react';

import type { GroupBadgeEntity, VolEntity } from '~/interfaces';

import { CreateEdit } from './common';

const { Title } = Typography;

export const GroupBadgeEdit: FC<IResourceComponentsProps> = () => {
    const translate = useTranslate();
    const { mutate } = useUpdateMany();

    const [volunteers, setVolunteers] = useState<Array<VolEntity & { markedDeleted: boolean, markedAdded: boolean }>>([]);
    const [openAdd, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selected, setSelected] = useState<Key[]>([]);

    const { formProps, id, saveButtonProps } = useForm<GroupBadgeEntity>({
        onMutationSuccess: () => {
            if (volunteers.some((item) => { return item.markedDeleted }))
                mutate({
                    resource: 'volunteers',
                    ids: volunteers.filter((vol) => vol.markedDeleted).map((vol) => vol.id),
                    values: { group_badge: null }
                });
            if (volunteers.some((item) => { return item.markedAdded }))
                mutate({
                    resource: 'volunteers',
                    ids: volunteers.filter((vol) => vol.markedAdded).map((vol) => vol.id),
                    values: { group_badge: id }
                });
        }
    });

    const { data: volunteersAll, isLoading: isVolunteersAllLoading } = useList<VolEntity>({
        resource: 'volunteers',
    });

    const { tableProps: currentVols } = useTable<VolEntity>({
        resource: 'volunteers',
        initialFilter: [
            {
                field: 'group_badge',
                operator: 'eq',
                value: id
            }
        ],
        initialSorter: [
            {
                field: 'id',
                order: 'desc'
            }
        ]
    });

    useEffect(
        () =>
            setVolunteers(
                (prevState) =>
                    currentVols.dataSource?.map((vol) => ({
                        ...vol,
                        markedDeleted: prevState.find((prevVol) => prevVol.id === vol.id)?.markedDeleted ?? false,
                        markedAdded: prevState.find((prevVol) => prevVol.id === vol.id)?.markedAdded ?? false
                    })) ?? []
            ),
        [currentVols.dataSource]
    );

    const addVolunteers = () => {

        //если волонтер уже был в списке, но помечен на удаление, убираем флаг удаления
        const volsCache = volunteers.map((item) => 
            ({ ...item, markedDeleted: selected.includes(item.id) ? false : item.markedDeleted, markedAdded: false }))

        // добавляем только тех волонтеров, которых не было в списке
        const currentIds = volsCache.map((item) => { return item.id })
        const volsAdd = volunteersAll?.data
            .filter((item) => { return selected.includes(item.id) && !currentIds.includes(item.id) })
            .map((item) =>
                ({ ...item, markedDeleted: false, markedAdded: true })) ?? []
        setVolunteers(
            volsCache.concat(volsAdd)
        );
        setSelected([])
    }

    const dataSource = useMemo(() => volunteers.filter((vol) => !vol.markedDeleted), [volunteers]);

    /**
     * данные для попапа добавить волонтеров
     */
    const filteredData = useMemo(() => {
        
        //todo если волонтер уже есть в volunteers но с флагом markedDeleted
        const currentIds = volunteers.filter((item)=>(!item.markedDeleted)).map((item) => { return item.id })
        return (
            searchText
                ? volunteersAll?.data.filter((item) => {
                    const searchTextInLowerCase = searchText.toLowerCase();
                    return [
                        item.name,
                        item.first_name,
                        item.last_name,
                        item.departments?.map(({ name }) => name).join(', ')
                    ].some((text) => {
                        return !currentIds.includes(item.id) && (text?.toLowerCase().includes(searchTextInLowerCase) || selected.includes(item.id));
                    });
                })
                : volunteersAll?.data.filter((item) => { return !currentIds.includes(item.id) })
        );
    }, [volunteersAll, volunteers, searchText, selected]);

    const rowSelection = {
        selectedRowKeys: selected,
        onChange: (e) => { setSelected(e) },
        type: 'checkbox'
    } as TableRowSelection<VolEntity>;

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout='vertical'>
                <CreateEdit />
            </Form>
            <Title level={5}>Волонтеры</Title>
            <Button onClick={() => setOpen(true)}>Добавить</Button>
            <Modal
                title="Добавить волонтеров"
                open={openAdd}
                onOk={() => {
                    addVolunteers();
                    setOpen(false)
                }}
                onCancel={() => setOpen(false)}>

                <Input placeholder='Поиск...' value={searchText} onChange={(e) => setSearchText(e.target.value)}></Input>

                <Table rowSelection={rowSelection}
                    dataSource={filteredData}
                    rowKey='id'
                    loading={isVolunteersAllLoading}>
                    <Table.Column
                        dataIndex='name'
                        key='name'
                        title='Имя на бейдже'
                        render={(value) => <TextField value={value} />}
                    />
                    <Table.Column
                        dataIndex='first_name'
                        key='first_name'
                        title='Имя'
                        render={(value) => <TextField value={value} />}
                    />
                    <Table.Column
                        dataIndex='last_name'
                        key='last_name'
                        title='Фамилия'
                        render={(value) => <TextField value={value} />}
                    />
                </Table>
            </Modal>

            <Table {...currentVols} dataSource={dataSource} rowKey='id'>
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя на бейдже'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='first_name'
                    key='first_name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='last_name'
                    key='last_name'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                />
                <Table.Column
                    dataIndex='departments'
                    key='departments    '
                    title='Службы'
                    render={(value) => <TextField value={value.map(({ name }) => name).join(', ')} />}
                />
                <Table.Column<Pick<VolEntity, 'id'>>
                    title='Действия'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton
                                hideText
                                size='small'
                                resourceNameOrRouteName='volunteers'
                                recordItemId={record.id}
                            />
                            <Popconfirm
                                title={translate('buttons.confirm', 'Are you sure?')}
                                okText={translate('buttons.delete', 'Delete')}
                                cancelText={translate('buttons.cancel', 'Cancel')}
                                okType='danger'
                                onConfirm={(): void => {
                                    setVolunteers(
                                        volunteers.find((item) => { return item.id === record.id })?.markedAdded
                                            ? volunteers.filter((item) => { return item.id != record.id })
                                            : volunteers.map((vol) =>
                                                vol.id === record.id ? ((vol.markedDeleted = true), vol) : vol
                                            )
                                    );
                                }}
                            >
                                <Button icon={<DeleteOutlined />} danger size='small' />
                            </Popconfirm>
                        </Space>
                    )}
                />
            </Table>
        </Edit >
    );
};
