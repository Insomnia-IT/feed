import { useMemo, useState, useCallback } from 'react';
import { Checkbox, TableProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import type { VolEntity } from 'interfaces';
import { dataProvider } from 'dataProvider';

interface UseMassEditParams {
    volunteersData: VolEntity[];
    totalVolunteersCount: number;
    filterQueryParams: string;
}

interface UseMassEditResult {
    selectedVols: VolEntity[];
    unselectAllSelected: () => void;
    unselectVolunteer: (volunteer: VolEntity) => void;
    rowSelection: TableProps<VolEntity>['rowSelection'];
}

export const useMassEdit = ({ totalVolunteersCount, filterQueryParams }: UseMassEditParams): UseMassEditResult => {
    const [selectedVols, setSelectedVols] = useState<VolEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const selectedRowKeys = useMemo(() => selectedVols.map((vol) => vol.id), [selectedVols]);

    const isAllSelected = useMemo(
        () => selectedVols.length > 0 && selectedVols.length === totalVolunteersCount,
        [selectedVols.length, totalVolunteersCount]
    );

    const unselectAllSelected = useCallback(() => {
        setSelectedVols([]);
    }, []);

    const onVolunteerSelection = useCallback((vol: VolEntity, isSelected: boolean) => {
        setSelectedVols((prev) => (isSelected ? [...prev, vol] : prev.filter((v) => v.id !== vol.id)));
    }, []);

    const handleSelectAllToggle = useCallback(async () => {
        if (isAllSelected) {
            setSelectedVols([]);
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await dataProvider.getList<VolEntity>({
                resource: `volunteers/${filterQueryParams}`,
                pagination: { current: 1, pageSize: 0 }
            });

            setSelectedVols(data);
        } finally {
            setIsLoading(false);
        }
    }, [isAllSelected, filterQueryParams]);

    const rowSelection: TableProps<VolEntity>['rowSelection'] = {
        onSelect: onVolunteerSelection,
        selectedRowKeys,
        getCheckboxProps: (record) => ({ name: record.name }),
        columnTitle: (
            <>
                <Checkbox
                    style={isLoading ? { display: 'none' } : undefined}
                    checked={isAllSelected}
                    indeterminate={selectedVols.length > 0 && !isAllSelected}
                    disabled={isLoading || totalVolunteersCount === 0}
                    title={isLoading ? 'Подождите, информация загружается...' : 'Выбрать всех в списке'}
                    onChange={handleSelectAllToggle}
                />
                {isLoading && <LoadingOutlined />}
            </>
        )
    };

    return {
        selectedVols,
        unselectAllSelected,
        unselectVolunteer: (vol) => onVolunteerSelection(vol, false),
        rowSelection
    };
};
