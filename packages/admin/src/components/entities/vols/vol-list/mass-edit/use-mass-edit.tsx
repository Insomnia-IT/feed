import type { VolEntity } from 'interfaces';
import { useEffect, useMemo, useState } from 'react';
import { Checkbox, TableProps } from 'antd';
import { useList } from '@refinedev/core';
import { LoadingOutlined } from '@ant-design/icons';

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
    const { data: volunteers, isLoading } = useList<VolEntity>({
        resource: `volunteers/${filterQueryParams}`,

        pagination: {
            current: 1,
            pageSize: 0
        }
    });

    const volunteersData: Array<VolEntity> = volunteers?.data ?? [];

    const [selectedVols, setSelectedVols] = useState<VolEntity[]>([]);

    const unselectAllSelected = () => {
        setSelectedVols([]);
    };

    useEffect(() => {
        setSelectedVols([]);
    }, [filterQueryParams]);

    const isAllCurrentSelected = totalVolunteersCount === selectedVols.length;

    const selectedRowKeys = useMemo(() => {
        return selectedVols.map((vol) => vol.id);
    }, [selectedVols]);

    const onVolunteerSelection = (volunteer: VolEntity, isSelected: boolean) => {
        if (isSelected) {
            setSelectedVols((prev) => [...prev, volunteer]);
        } else {
            setSelectedVols((prev) => prev.filter((storedVol) => storedVol.id !== volunteer.id));
        }
    };

    const rowSelection: TableProps<VolEntity>['rowSelection'] = {
        onSelect: onVolunteerSelection,
        selectedRowKeys: selectedRowKeys,
        getCheckboxProps: (record: VolEntity) => ({
            name: record.name
        }),
        columnTitle: (
            <>
                <Checkbox
                    style={isLoading ? { display: 'none' } : undefined}
                    checked={selectedVols.length > 0 && totalVolunteersCount === selectedVols.length}
                    disabled={isLoading || totalVolunteersCount === 0}
                    title={isLoading ? 'Подождите, информация загружается...' : 'Выбрать всех в списке'}
                    indeterminate={!!selectedVols.length && !(totalVolunteersCount === selectedVols.length)}
                    onChange={() => {
                        if (isAllCurrentSelected) {
                            setSelectedVols([]);
                        } else {
                            setSelectedVols(volunteersData);
                        }
                    }}
                />
                {isLoading ? <LoadingOutlined /> : null}
            </>
        )
    };

    return {
        selectedVols: selectedVols,
        unselectAllSelected,
        rowSelection
    };
};
