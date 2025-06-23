import type { VolEntity } from 'interfaces';
import { useCallback, useMemo, useState } from 'react';
import { Checkbox, TableProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { dataProvider } from 'dataProvider';

export const useMassEdit = ({
    totalVolunteersCount,
    filterQueryParams
}: {
    totalVolunteersCount: number;
    filterQueryParams: string;
}): {
    reloadSelectedVolunteers: () => Promise<void>;
    selectedVols: Array<VolEntity>;
    unselectAllSelected: () => void;
    unselectVolunteer: (volunteer: VolEntity) => void;
    rowSelection: TableProps<VolEntity>['rowSelection'];
} => {
    const [selectedVols, setSelectedVols] = useState<VolEntity[]>([]);
    const [isSelectAllLoading, setIsSelectAllLoading] = useState(false);

    const unselectAllSelected = () => {
        setSelectedVols([]);
    };

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
                    style={isSelectAllLoading ? { display: 'none' } : undefined}
                    checked={selectedVols.length > 0 && totalVolunteersCount === selectedVols.length}
                    disabled={isSelectAllLoading || totalVolunteersCount === 0}
                    title={isSelectAllLoading ? 'Подождите, информация загружается...' : 'Выбрать всех в списке'}
                    indeterminate={!!selectedVols.length && !(totalVolunteersCount === selectedVols.length)}
                    onChange={async () => {
                        if (isAllCurrentSelected) {
                            setSelectedVols([]);
                        } else {
                            setIsSelectAllLoading(true);
                            try {
                                const { data: volunteersData } = await dataProvider.getList<VolEntity>({
                                    resource: `volunteers/${filterQueryParams}`,
                                    pagination: {
                                        current: 1,
                                        pageSize: 0
                                    }
                                });

                                setSelectedVols(volunteersData);
                            } finally {
                                setIsSelectAllLoading(false);
                            }
                        }
                    }}
                />
                {isSelectAllLoading ? <LoadingOutlined /> : null}
            </>
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
        unselectVolunteer: (volunteer: VolEntity) => {
            onVolunteerSelection(volunteer, false);
        }
    };
};
