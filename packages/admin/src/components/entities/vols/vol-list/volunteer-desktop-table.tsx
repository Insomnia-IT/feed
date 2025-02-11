import { Checkbox, Table, Tag } from 'antd';
import type { TablePaginationConfig, TableProps } from 'antd';
import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import { FC, useMemo, useContext, useState, useEffect } from 'react';

import type { ArrivalEntity, CustomFieldEntity, DirectionEntity, VolEntity } from 'interfaces';
import { getSorter } from 'utils';
import { findClosestArrival, getOnFieldColors } from './volunteer-list-utils';
import { ActiveColumnsContext } from 'components/entities/vols/vol-list/active-columns-context';

import styles from '../list.module.css';

const getCustomValue = (vol: VolEntity, customField: CustomFieldEntity): string | boolean => {
    const value =
        vol.custom_field_values.find((customFieldValue) => customFieldValue.custom_field === customField.id)?.value ||
        '';
    if (customField.type === 'boolean') {
        return value === 'true';
    }
    return value;
};

function getFormattedArrivals(arrivalString: string): string {
    const date = new Date(arrivalString);
    const options: Intl.DateTimeFormatOptions = {
        month: '2-digit',
        day: '2-digit'
    };

    return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

/* Компонент отображающий список волонтеров на декстопе */
export const VolunteerDesktopTable: FC<{
    openVolunteer: (id: number) => Promise<boolean>;
    volunteersData: Array<VolEntity>;
    volunteersIsLoading: boolean;
    pagination: TablePaginationConfig;
    statusById: Record<string, string>;
    customFields?: Array<CustomFieldEntity>;
}> = ({ customFields, openVolunteer, pagination, statusById, volunteersData, volunteersIsLoading }) => {
    const { activeColumns = [] } = useContext(ActiveColumnsContext) ?? {};

    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [isAllCurrentSelected, setIsAllCurrentSelected] = useState(false);

    useEffect(() => {
        if (isAllCurrentSelected) {
            setSelectedRows(volunteersData.map((item) => item.id));
        }
    }, [isAllCurrentSelected, volunteersData]);

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
                checked={isAllCurrentSelected || selectedRows.length === pagination.total}
                onChange={(event) => {
                    if (!event.target.checked) {
                        setSelectedRows([]);
                    }

                    setIsAllCurrentSelected(!isAllCurrentSelected);
                }}
            />
        )
    };

    const getCellAction: (id: number) => { onClick: (event: any) => void } = (
        id: number
    ): { onClick: (event: any) => void } => {
        return {
            onClick: (e): void => {
                if (!e.target.closest('button')) {
                    openVolunteer(id);
                }
            }
        };
    };

    const fields: TableProps<VolEntity>['columns'] = [
        {
            dataIndex: 'id',
            key: 'id',
            title: 'ID'
        },
        {
            dataIndex: 'name',
            key: 'name',
            title: 'Позывной'
        },
        {
            dataIndex: 'first_name',
            key: 'first_name',
            title: 'Имя'
        },
        {
            dataIndex: 'last_name',
            key: 'last_name',
            title: 'Фамилия'
        },
        {
            dataIndex: 'directions',
            key: 'directions',
            title: 'Службы / Локации',
            render: (value: DirectionEntity[]) => {
                return (
                    <>
                        {value.map(({ name }) => (
                            <Tag key={name} color={'default'} icon={false} closable={false}>
                                {name}
                            </Tag>
                        ))}
                    </>
                );
            }
        },
        {
            dataIndex: 'arrivals',
            key: 'arrivals',
            title: 'Даты на поле',
            render: (arrivals: Array<ArrivalEntity>) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {arrivals
                        .slice()
                        .sort(getSorter('arrival_date'))
                        .map(({ arrival_date, departure_date }) => {
                            const arrival = getFormattedArrivals(arrival_date);
                            const departure = getFormattedArrivals(departure_date);
                            return (
                                <div
                                    style={{ whiteSpace: 'nowrap' }}
                                    key={`${arrival_date}${departure_date}`}
                                >{`${arrival} - ${departure}`}</div>
                            );
                        })}
                </div>
            )
        },
        {
            key: 'on_field',
            title: 'Статус',
            render: (vol) => {
                const currentArrival = findClosestArrival(vol.arrivals);
                const currentStatus = currentArrival ? statusById[currentArrival?.status] : 'Статус неизвестен';
                return <div>{<Tag color={getOnFieldColors(vol)}>{currentStatus}</Tag>}</div>;
            }
        },
        {
            dataIndex: 'is_blocked',
            key: 'is_blocked',
            title: '❌',
            render: (value) => <ListBooleanNegative value={Boolean(value)} />
        },
        {
            dataIndex: 'kitchen',
            key: 'kitchen',
            title: 'Кухня'
        },
        {
            dataIndex: 'printing_batch',
            key: 'printing_batch',
            title: (
                <span>
                    Партия
                    <br />
                    Бейджа
                </span>
            )
        },
        {
            dataIndex: 'comment',
            key: 'comment',
            title: 'Комментарий',
            render: (value) => <div dangerouslySetInnerHTML={{ __html: value }} />
        },
        ...(customFields?.map((customField) => {
            return {
                key: customField.name,
                title: customField.name,
                render: (vol: VolEntity) => {
                    const value = getCustomValue(vol, customField);

                    if (customField.type === 'boolean') {
                        return <ListBooleanPositive value={value as boolean} />;
                    }

                    return value;
                }
            };
        }) ?? [])
    ];

    const visibleColumns = !activeColumns.length
        ? fields // Не отображать ничего - странно и не ясно зачем. Поэтому отображаем без фильтрации в таком случае
        : fields.filter((column) => activeColumns.includes(String(column.key)));

    return (
        <Table<VolEntity>
            onRow={(record) => {
                return getCellAction(record.id);
            }}
            scroll={{ x: '100%' }}
            pagination={pagination}
            loading={volunteersIsLoading}
            dataSource={volunteersData}
            rowKey="id"
            rowClassName={styles.cursorPointer}
            columns={visibleColumns}
            rowSelection={rowSelection}
        />
    );
};

export const CheckMark: FC<{
    checked: boolean;
}> = ({ checked }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'green' : undefined
        }),
        [checked]
    );
    return <CheckOutlined style={style} />;
};

export const StopMark: FC<{
    checked: boolean;
}> = ({ checked }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'red' : undefined
        }),
        [checked]
    );
    return <StopOutlined style={style} />;
};

export const ListBooleanPositive: FC<{
    value: boolean;
}> = ({ value }) => {
    return value ? <CheckMark checked={value} /> : null;
};

export const ListBooleanNegative: FC<{
    value: boolean;
}> = ({ value }) => {
    return value ? <StopMark checked={value} /> : null;
};
