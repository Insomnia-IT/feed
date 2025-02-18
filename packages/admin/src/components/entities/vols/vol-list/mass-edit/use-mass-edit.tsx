import type { VolEntity } from 'interfaces';
import { useEffect, useState } from 'react';
import { Checkbox, TableProps } from 'antd';

export const useMassEdit = (
    volunteersData: Array<VolEntity> = [],
    totalVolunteersCount: number
): {
    selectedRows: number[];
    setSelectedRows: (value: number[]) => void;
    unselectAllSelected: () => void;
    isAllCurrentSelected: boolean;
    setIsAllCurrentSelected: (value: boolean) => void;
    rowSelection: TableProps<VolEntity>['rowSelection'];
} => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [isAllCurrentSelected, setIsAllCurrentSelected] = useState(false);

    useEffect(() => {
        if (isAllCurrentSelected) {
            setSelectedRows(volunteersData.map((item) => item.id));
        } else {
            setSelectedRows([]);
        }
    }, [isAllCurrentSelected, volunteersData]);

    const unselectAllSelected = () => {
        setIsAllCurrentSelected(false);
        setSelectedRows([]);
    };

    const rowSelection: TableProps<VolEntity>['rowSelection'] = {
        onChange: (_selectedRowKeys: React.Key[], selectedRows: VolEntity[]) => {
            setSelectedRows(selectedRows.map((item) => item.id));
        },
        selectedRowKeys: selectedRows,
        getCheckboxProps: (record: VolEntity) => ({
            name: record.name
        }),
        columnTitle: (
            <Checkbox
                checked={isAllCurrentSelected}
                onChange={() => {
                    setIsAllCurrentSelected(!isAllCurrentSelected);
                }}
            />
        )
    };

    return {
        selectedRows,
        setSelectedRows,
        unselectAllSelected,
        isAllCurrentSelected: isAllCurrentSelected || totalVolunteersCount === selectedRows.length,
        setIsAllCurrentSelected,
        rowSelection
    };
};
