import { ListBooleanNegative, ListBooleanPositive } from '@feed/ui/src/icons'; // TODO exclude src
import { Table, Tag } from '@pankod/refine-antd';
import type { TablePaginationConfig, TableProps } from '@pankod/refine-antd';

import type { CustomFieldEntity, VolEntity } from '~/interfaces';
import { getSorter } from '~/utils';

import styles from '../list.module.css';

import { findClosestArrival, getOnFieldColors } from './volunteer-list-utils';
import { ActiveColumnsContext } from '~/components/entities/vols/vol-list/active-columns-context';
import { useContext } from 'react';

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
    const options: Intl.DateTimeFormatOptions = { month: '2-digit', day: '2-digit' };

    return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

/* Компонент отображающий список волонтеров на декстопе */
export const VolunteerDesktopTable: FC<{
    openVolunteer: (id: number) => Promise<any>;
    volunteersData: Array<VolEntity>;
    volunteersIsLoading: boolean;
    pagination: TablePaginationConfig;
    statusById: Record<string, string>;
    customFields?: Array<CustomFieldEntity>;
}> = ({ customFields, openVolunteer, pagination, statusById, volunteersData, volunteersIsLoading }) => {
    const { activeColumns = [] } = useContext(ActiveColumnsContext) ?? {};

    const getCellAction = (id: number): { onClick: (event: any) => Promise<any> | undefined } => {
        return {
            onClick: (e): Promise<boolean> | undefined => {
                if (!e.target.closest('button')) {
                    return openVolunteer(id);
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
            render: (value) => {
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
            render: (arrivals) => (
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
            rowKey='id'
            rowClassName={styles.cursorPointer}
            columns={visibleColumns}
        />
    );
};
