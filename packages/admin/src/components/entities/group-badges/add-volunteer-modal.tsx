import { Input, Modal, Table } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { useState } from 'react';
import type { FC, Key } from 'react';
import { useList } from '@refinedev/core';

import type { VolEntity } from 'interfaces';
import { useMedia } from 'shared/providers';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';

type VolEntityExtended = VolEntity & { markedDeleted: boolean; markedAdded: boolean };

export const AddVolunteerModal: FC<{
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    volunteers: Array<VolEntityExtended>;
    setVolunteers: (value: Array<VolEntityExtended>) => void;
}> = ({ isOpen, setIsOpen, setVolunteers, volunteers }) => {
    const [searchText, setSearchText] = useState('');
    const [selected, setSelected] = useState<Array<Key>>([]);

    const { isDesktop } = useMedia();
    const visibleDirections = useVisibleDirections();

    const { data, isLoading: isVolunteersAllLoading } = useList<VolEntity>({
        resource: 'volunteers'
    });
    const { data: volunteersAll = [] } = data ?? {};

    const addVolunteers = (): void => {
        //если волонтер уже был в списке, но помечен на удаление, убираем флаг удаления
        const updatedVolunteers = volunteers.map((item) => ({
            ...item,
            markedDeleted: selected.includes(item.id) ? false : item.markedDeleted,
            markedAdded: item?.markedAdded ?? false
        }));

        // добавляем только тех волонтеров, которых не было в списке
        const currentIds = volunteers.map((item) => item.id);
        const newVolunteers = volunteersAll
            .filter((item) => selected.includes(item.id) && !currentIds.includes(item.id))
            .map((item) => ({ ...item, markedDeleted: false, markedAdded: true }));

        setVolunteers([...updatedVolunteers, ...newVolunteers]);
        setSelected([]);
    };

    // Если волонтер уже есть в volunteers но с флагом markedDeleted, считаем, что его нет в бейдже
    const currentIds = volunteers.filter((item) => !item.markedDeleted).map((item) => item.id);

    const filteredVols = volunteersAll.filter(
        (vol) => !visibleDirections || vol.directions?.some(({ id }) => visibleDirections.includes(id))
    );

    const searchTextLower = searchText.toLowerCase();
    const filteredData = filteredVols.filter((item) => {
        if (!searchText) {
            return !currentIds.includes(item.id);
        }

        const isSelected = selected.includes(item.id);
        const isNotCurrent = !currentIds.includes(item.id);
        const matchesSearch = [
            item.name,
            item.first_name,
            item.last_name,
            item.directions?.map(({ name }) => name).join(', ')
        ]
            .filter(Boolean)
            .some((text) => text?.toLowerCase().includes(searchTextLower));

        return isNotCurrent && (matchesSearch || isSelected);
    });

    const rowSelection: TableRowSelection<VolEntity> = {
        selectedRowKeys: selected,
        onChange: setSelected,
        type: 'checkbox'
    };

    return (
        <Modal
            title="Добавить волонтеров"
            open={isOpen}
            onOk={(): void => {
                addVolunteers();
                setIsOpen(false);
            }}
            onCancel={() => setIsOpen(false)}
        >
            <Input
                placeholder="Поиск..."
                value={searchText}
                onChange={(event): void => {
                    setSearchText(event.target.value);
                }}
                style={{ marginBottom: 16 }}
            />
            <Table
                rowSelection={rowSelection}
                dataSource={filteredData}
                rowKey="id"
                loading={isVolunteersAllLoading}
                size="small"
                pagination={{
                    pageSize: isDesktop ? 100 : 5,
                    showSizeChanger: false,
                    size: 'small'
                }}
            >
                <Table.Column dataIndex="name" key="name" title="Имя на бейдже" ellipsis width="40%" />
                <Table.Column dataIndex="first_name" key="first_name" title="Имя" ellipsis />
                <Table.Column dataIndex="last_name" key="last_name" title="Фамилия" ellipsis />
            </Table>
        </Modal>
    );
};
