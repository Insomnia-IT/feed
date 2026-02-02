import { useCallback, useState } from 'react';
import { Checkbox, type TableProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import type { VolEntity } from 'interfaces';
import { dataProvider } from 'dataProvider';

interface UseMassEditParams {
    totalVolunteersCount: number;
    filterQueryParams: string;
}

interface UseMassEditResult {
    reloadSelectedVolunteers: () => Promise<void>;
    selectedVols: Array<VolEntity>;
    unselectAllSelected: () => void;
    unselectVolunteer: (volunteer: VolEntity) => void;
    rowSelection: TableProps<VolEntity>['rowSelection'];
}

export const useMassEdit = ({ totalVolunteersCount, filterQueryParams }: UseMassEditParams): UseMassEditResult => {
    const [selectedVols, setSelectedVols] = useState<VolEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const selectedRowKeys = selectedVols.map((vol) => vol.id);

    const isAllSelected = selectedVols.length > 0 && selectedVols.length === totalVolunteersCount;

    const unselectAllSelected = () => {
        setSelectedVols([]);
    };

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
                pagination: { currentPage: 1, pageSize: 0 }
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Checkbox
                    style={isLoading ? { display: 'none' } : undefined}
                    checked={isAllSelected}
                    indeterminate={selectedVols.length > 0 && !isAllSelected}
                    disabled={isLoading || totalVolunteersCount === 0}
                    title={isLoading ? 'Подождите, информация загружается...' : 'Выбрать всех в списке'}
                    onChange={handleSelectAllToggle}
                />
                {isLoading ? <LoadingOutlined /> : null}
            </span>
        )
    };

    const reloadSelectedVolunteers = useCallback(async () => {
        const promises = selectedRowKeys.map(async (volId: number) => {
            return dataProvider.getOne<VolEntity>({ resource: 'volunteers', id: String(volId) });
        });

        const values = await Promise.allSettled(promises).then((values) =>
            values
                .map((value) => (value.status === 'fulfilled' ? value.value.data : undefined))
                .filter((value) => typeof value !== 'undefined')
        );

        setSelectedVols(values);
    }, [selectedRowKeys]);

    return {
        reloadSelectedVolunteers,
        rowSelection,
        selectedVols,
        unselectAllSelected,
        unselectVolunteer: (vol) => onVolunteerSelection(vol, false)
    };
};
