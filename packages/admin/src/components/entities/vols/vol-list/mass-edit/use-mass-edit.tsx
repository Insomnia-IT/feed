import type { VolEntity } from 'interfaces';
import { useEffect, useMemo, useState } from 'react';
import { Checkbox, TableProps } from 'antd';
import { useList } from '@refinedev/core';

export const useMassEdit = ({
    totalVolunteersCount,
    filterQueryParams
}: {
    volunteersData: Array<VolEntity>;
    totalVolunteersCount: number;
    filterQueryParams: string;
}): {
    selectedVols: Array<VolEntity>;
    unselectAllSelected: () => void;
    rowSelection: TableProps<VolEntity>['rowSelection'];
} => {
    const { data: volunteers } = useList<VolEntity>({
        resource: `volunteers/${filterQueryParams}`,

        pagination: {
            current: 1,
            pageSize: 10000
        }
    });

    const volunteersData: Array<VolEntity> = volunteers?.data ?? [];

    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const unselectAllSelected = () => {
        setSelectedRows([]);
    };

    useEffect(() => {
        setSelectedRows([]);
    }, [filterQueryParams]);

    const isAllCurrentSelected = totalVolunteersCount === selectedRows.length;

    const rowSelection: TableProps<VolEntity>['rowSelection'] = {
        onSelect: (volunteer, isSelected) => {
            if (isSelected) {
                setSelectedRows([...selectedRows, volunteer.id]);
            } else {
                setSelectedRows(selectedRows.filter((id) => id !== volunteer.id));
            }
        },
        selectedRowKeys: selectedRows,
        getCheckboxProps: (record: VolEntity) => ({
            name: record.name
        }),
        columnTitle: (
            <Checkbox
                checked={totalVolunteersCount === selectedRows.length}
                onChange={() => {
                    if (isAllCurrentSelected) {
                        setSelectedRows([]);
                    } else {
                        setSelectedRows(volunteersData.map((vol) => vol.id));
                    }
                }}
            />
        )
    };

    const selectedVols = useMemo(() => {
        if (isAllCurrentSelected) {
            return volunteersData;
        }

        return volunteersData?.filter((vol) => selectedRows.includes(vol.id));
    }, [isAllCurrentSelected, selectedRows]);

    return {
        selectedVols,
        unselectAllSelected,
        rowSelection
    };
};
