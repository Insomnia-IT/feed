import { Button } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { FC, useState } from 'react';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

import type { ArrivalEntity, CustomFieldEntity } from 'interfaces';
import { dataProvider } from 'dataProvider';
import { formDateFormat, saveXLSX } from 'shared/lib';

export const SaveAsXlsxButton: FC<{
    isDisabled: boolean;
    customFields?: Array<CustomFieldEntity>;
    filterQueryParams: string;
    volunteerRoleById: Record<string, string>;
    statusById: Record<string, string>;
    transportById: Record<string, string>;
    kitchenNameById: Record<string, string>;
    feedTypeNameById: Record<string, string>;
    accessRoleById: Record<string, string>;
}> = ({
    accessRoleById,
    customFields,
    feedTypeNameById,
    filterQueryParams,
    isDisabled,
    kitchenNameById,
    statusById,
    transportById,
    volunteerRoleById
}) => {
    const [isExporting, setIsExporting] = useState(false);

    return (
        <Button
            shape={'default'}
            type={'primary'}
            onClick={() => {
                void createAndSaveXLSX({
                    accessRoleById,
                    customFields,
                    feedTypeNameById,
                    filterQueryParams,
                    kitchenNameById,
                    setIsExporting,
                    statusById,
                    transportById,
                    volunteerRoleById
                });
            }}
            icon={isExporting ? <LoadingOutlined spin /> : <DownloadOutlined />}
            disabled={isDisabled}
        >
            Выгрузить
        </Button>
    );
};

const createAndSaveXLSX = async ({
    accessRoleById,
    customFields = [],
    feedTypeNameById,
    filterQueryParams,
    kitchenNameById,
    setIsExporting,
    statusById,
    transportById,
    volunteerRoleById
}: {
    filterQueryParams: string;
    setIsExporting: (value: boolean) => void;
    customFields?: Array<CustomFieldEntity>;
    volunteerRoleById: Record<string, string>;
    statusById: Record<string, string>;
    transportById: Record<string, string>;
    kitchenNameById: Record<string, string>;
    feedTypeNameById: Record<string, string>;
    accessRoleById: Record<string, string>;
}): Promise<void> => {
    setIsExporting(true);

    try {
        const { data: allPagesData } = await dataProvider.getList({
            resource: `volunteers/${filterQueryParams}`
        });

        if (allPagesData) {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Volunteers');

            const header = [
                'ID',
                'Позывной',
                'Имя',
                'Фамилия',
                'Службы/Локации',
                'Роль',
                'Статус текущего завезда',
                'Дата текущего заезда',
                'Транспорт текущего заезда',
                'Дата текущего отъезда',
                'Транспорт текущего отъезда',
                'Статус будущего завезда',
                'Дата будущего заезда',
                'Транспорт будущего заезда',
                'Дата будущего отъезда',
                'Транспорт будущего отъезда',
                'Заблокирован',
                'Кухня',
                'Партия бейджа',
                'Тип питания',
                'Веган/мясоед',
                'Комментарий',
                'Право доступа',
                // eslint-disable-next-line no-unsafe-optional-chaining
                ...customFields?.map((field): string => field.name)
            ];

            sheet.addRow(header);

            allPagesData.forEach((vol) => {
                const currentArrival: ArrivalEntity | undefined = vol.arrivals.find(
                    ({ arrival_date, departure_date }: { arrival_date: string; departure_date: string }) =>
                        dayjs(arrival_date) < dayjs() && dayjs(departure_date) > dayjs().subtract(1, 'day')
                );

                const futureArrival: ArrivalEntity | undefined = vol.arrivals.find(
                    ({ arrival_date }: { arrival_date: string }) => dayjs(arrival_date) > dayjs()
                );

                sheet.addRow([
                    vol.id,
                    vol.name,
                    vol.first_name,
                    vol.last_name,
                    vol.directions
                        ? vol.directions.map((direction: { name: string }) => direction.name).join(', ')
                        : '',
                    vol.main_role ? volunteerRoleById[vol.main_role] : '',
                    currentArrival ? statusById[currentArrival?.status] : '',
                    currentArrival ? dayjs(currentArrival.arrival_date).format(formDateFormat) : '',
                    currentArrival ? transportById[currentArrival?.arrival_transport] : '',
                    currentArrival ? dayjs(currentArrival.departure_date).format(formDateFormat) : '',
                    currentArrival ? transportById[currentArrival?.departure_transport] : '',
                    futureArrival ? statusById[futureArrival?.status] : '',
                    futureArrival ? dayjs(futureArrival.arrival_date).format(formDateFormat) : '',
                    futureArrival ? transportById[futureArrival?.arrival_transport] : '',
                    futureArrival ? dayjs(futureArrival.departure_date).format(formDateFormat) : '',
                    futureArrival ? transportById[futureArrival?.departure_transport] : '',
                    vol.is_blocked ? 1 : 0,
                    vol.kitchen ? kitchenNameById[vol.kitchen] : '',
                    vol.printing_batch,
                    vol.feed_type ? feedTypeNameById[vol.feed_type] : '',
                    vol.is_vegan ? 'веган' : 'мясоед',
                    vol.comment ? vol.comment.replace(/<[^>]*>/g, '') : '',
                    vol.access_role ? accessRoleById[vol.access_role] : '',
                    ...(customFields?.map((field) => {
                        const value =
                            vol.custom_field_values.find(
                                (fieldValue: { custom_field: number }): boolean => fieldValue.custom_field === field.id
                            )?.value || '';
                        if (field.type === 'boolean') {
                            return value === 'true' ? 1 : 0;
                        }
                        return value;
                    }) ?? [])
                ]);
            });

            void saveXLSX(workbook, 'volunteers');
        }
    } finally {
        setIsExporting(false);
    }
};
