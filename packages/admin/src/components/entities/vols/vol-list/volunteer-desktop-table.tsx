import { useMemo, useContext, type MouseEvent as ReactMouseEvent } from 'react';
import { Table, Tag } from 'antd';
import type { TablePaginationConfig, TableProps } from 'antd';
import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import type { TableRowSelection } from 'antd/es/table/interface';

import { RichTextPreview } from 'components/controls/rich-text-preview';
import type { ArrivalEntity, CustomFieldEntity, DirectionEntity, VolEntity } from 'interfaces';
import { findClosestArrival, getFormattedArrivalIntervals, getOnFieldColors } from './volunteer-list-utils';
import { ActiveColumnsContext } from 'components/entities/vols/vol-list/active-columns-context';

import styles from '../list.module.css';

type VolTableRow = VolEntity & {
    closestArrival: ArrivalEntity | null;
    onFieldColor: ReturnType<typeof getOnFieldColors>;
    arrivalIntervals: string[];
    paidArrivalIntervals: string[];
    customFieldValueById: Record<number, string | boolean>;
};

const mapCustomFieldValues = (vol: VolEntity, customFields: CustomFieldEntity[]): Record<number, string | boolean> => {
    const customFieldTypeById = new Map(customFields.map((customField) => [customField.id, customField.type]));
    const values: Record<number, string | boolean> = {};

    for (const customFieldValue of vol.custom_field_values) {
        const type = customFieldTypeById.get(customFieldValue.custom_field);
        values[customFieldValue.custom_field] =
            type === 'boolean' ? customFieldValue.value === 'true' : customFieldValue.value;
    }

    return values;
};

/* Компонент отображающий список волонтеров на декстопе */
export const VolunteerDesktopTable = ({
    customFields,
    openVolunteer,
    pagination,
    statusById,
    volunteersData,
    volunteersIsLoading,
    rowSelection
}: {
    openVolunteer: (id: number) => Promise<boolean>;
    volunteersData: Array<VolEntity>;
    volunteersIsLoading: boolean;
    pagination: TablePaginationConfig;
    statusById: Record<string, string>;
    customFields?: Array<CustomFieldEntity>;
    rowSelection?: TableRowSelection<VolEntity> | undefined;
}) => {
    const { activeColumns = [] } = useContext(ActiveColumnsContext) ?? {};
    const tableData = useMemo<VolTableRow[]>(
        () =>
            volunteersData.map((vol) => {
                const closestArrival = findClosestArrival(vol.arrivals);
                return {
                    ...vol,
                    closestArrival,
                    onFieldColor: getOnFieldColors(vol, closestArrival),
                    arrivalIntervals: getFormattedArrivalIntervals(vol.arrivals),
                    paidArrivalIntervals: getFormattedArrivalIntervals(vol.paid_arrivals),
                    customFieldValueById: mapCustomFieldValues(vol, customFields ?? [])
                };
            }),
        [customFields, volunteersData]
    );

    const getCellAction: (id: number) => { onClick: (event: ReactMouseEvent<HTMLElement>) => void } = (
        id: number
    ): { onClick: (event: ReactMouseEvent<HTMLElement>) => void } => {
        return {
            onClick: (event): void => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                if (!(target.closest('button') || target.closest('input'))) {
                    openVolunteer(id);
                }
            }
        };
    };

    const fields = useMemo<NonNullable<TableProps<VolTableRow>['columns']>>(
        () => [
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
                render: (value: DirectionEntity[]) => (
                    <>
                        {value.map(({ name }) => (
                            <Tag key={name} color={'default'} icon={false} closable={false}>
                                {name}
                            </Tag>
                        ))}
                    </>
                )
            },
            {
                dataIndex: 'supervisor',
                key: 'supervisor',
                title: 'Бригадир',
                render: (supervisor) => supervisor?.name
            },
            {
                dataIndex: 'arrivalIntervals',
                key: 'arrivals',
                title: 'Даты на поле',
                render: (arrivalIntervals: string[]) => (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {arrivalIntervals.map((interval) => (
                            <div style={{ whiteSpace: 'nowrap' }} key={interval}>
                                {interval}
                            </div>
                        ))}
                    </div>
                )
            },
            {
                dataIndex: 'paidArrivalIntervals',
                key: 'paid_arrivals',
                title: 'Оплаченные даты',
                render: (paidArrivalIntervals: string[]) => (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {paidArrivalIntervals.map((interval) => (
                            <div style={{ whiteSpace: 'nowrap' }} key={interval}>
                                {interval}
                            </div>
                        ))}
                    </div>
                )
            },
            {
                key: 'on_field',
                title: 'Статус',
                render: (vol) => {
                    const currentStatus = vol.closestArrival
                        ? statusById[vol.closestArrival.status]
                        : 'Статус неизвестен';
                    return <div>{<Tag color={vol.onFieldColor}>{currentStatus}</Tag>}</div>;
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
                render: (value) => <RichTextPreview html={value} />
            },
            ...(customFields?.map((customField) => ({
                key: customField.name,
                title: customField.name,
                render: (vol: VolTableRow) => {
                    const value = vol.customFieldValueById[customField.id] ?? '';

                    if (customField.type === 'boolean') {
                        return <ListBooleanPositive value={Boolean(value)} />;
                    }

                    return value;
                }
            })) ?? [])
        ],
        [customFields, statusById]
    );

    const visibleColumns = activeColumns.length
        ? fields.filter((column) => activeColumns.includes(String(column.key)))
        : fields;

    return (
        <>
            <Table<VolTableRow>
                onRow={(record) => {
                    return getCellAction(record.id);
                }}
                scroll={{ x: '100%' }}
                pagination={pagination}
                loading={volunteersIsLoading}
                dataSource={tableData}
                rowKey="id"
                rowClassName={styles.cursorPointer}
                columns={visibleColumns}
                rowSelection={rowSelection as TableRowSelection<VolTableRow> | undefined}
            />
        </>
    );
};

const CheckMark = ({ checked }: { checked: boolean }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'green' : undefined
        }),
        [checked]
    );
    return <CheckOutlined style={style} />;
};

const StopMark = ({ checked }: { checked: boolean }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'red' : undefined
        }),
        [checked]
    );
    return <StopOutlined style={style} />;
};

const ListBooleanPositive = ({ value }: { value: boolean }) => {
    return value ? <CheckMark checked={value} /> : null;
};

const ListBooleanNegative = ({ value }: { value: boolean }) => {
    return value ? <StopMark checked={value} /> : null;
};
