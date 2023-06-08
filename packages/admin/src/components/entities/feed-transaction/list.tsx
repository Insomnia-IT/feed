import { DateField, DeleteButton, List, Space, Table, TextField, useTable } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useList } from '@pankod/refine-core';
import { renderText } from '@feed/ui/src/table';
import { useMemo } from 'react';

import type { FeedTransactionEntity, KitchenEntity, VolEntity } from '~/interfaces';

const mealTimeById = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const FeedTransactionList: FC<IResourceComponentsProps> = () => {
    const { tableProps } = useTable<FeedTransactionEntity>();

    const { data: vols } = useList<VolEntity>({
        resource: 'volunteers'
    });

    const volNameById = useMemo(() => {
        return (vols ? vols.data : []).reduce(
            (acc, vol) => ({
                ...acc,
                [vol.id]: vol.nickname
            }),
            {}
        );
    }, [vols]);

    const volQrById = useMemo(() => {
        return (vols ? vols.data : []).reduce(
            (acc, vol) => ({
                ...acc,
                [vol.id]: vol.qr
            }),
            {}
        );
    }, [vols]);

    const { data: kitchens } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {}
        );
    }, [kitchens]);

    return (
        <List>
            <Table {...tableProps} rowKey='ulid'>
                <Table.Column
                    dataIndex='dtime'
                    key='dtime'
                    title='Время'
                    render={(value) => value && <DateField format='DD/MM/YY HH:mm:ss' value={value} />}
                />
                <Table.Column
                    dataIndex='volunteer'
                    title='Волонтер'
                    render={(value) => <TextField value={value ? volNameById[value] : 'Аноним'} />}
                    // filterDropdown={(props) => (
                    //     <FilterDropdown {...props}>
                    //         <Select style={selectStyle} placeholder='Волонтер' {...volSelectProps} />
                    //     </FilterDropdown>
                    // )}
                />
                <Table.Column
                    dataIndex='volunteer'
                    title='Бэйдж'
                    render={(value) => <TextField value={value ? volQrById[value] : ''} />}
                    // filterDropdown={(props) => (
                    //     <FilterDropdown {...props}>
                    //         <Select style={selectStyle} placeholder='Волонтер' {...volSelectProps} />
                    //     </FilterDropdown>
                    // )}
                />
                <Table.Column
                    dataIndex='is_vegan'
                    title='Веган'
                    render={(value) => <TextField value={value ? 'Да' : 'Нет'} />}
                    // filterDropdown={(props) => (
                    //     <FilterDropdown {...props}>
                    //         <Select style={selectStyle} placeholder='Волонтер' {...volSelectProps} />
                    //     </FilterDropdown>
                    // )}
                />
                <Table.Column
                    dataIndex='meal_time'
                    key='meal_time'
                    title='Прием пищи'
                    render={(value) => <TextField value={mealTimeById[value]} />}
                />
                <Table.Column
                    dataIndex='kitchen'
                    key='kitchen'
                    title='Кухня'
                    render={(value) => <TextField value={kitchenNameById[value]} />}
                />
                <Table.Column dataIndex='amount' key='amount' title='Кол-во' render={renderText} />
                <Table.Column dataIndex='reason' key='reason' title='Причина' render={renderText} />
                <Table.Column<FeedTransactionEntity>
                    title='Actions'
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            {/* <EditButton hideText size='small' recordItemId={record.id} /> */}
                            <DeleteButton hideText size='small' recordItemId={record.ulid} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
