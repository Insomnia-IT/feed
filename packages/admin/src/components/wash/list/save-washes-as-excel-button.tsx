import { WashEntity } from 'interfaces';
import { dataProvider } from '../../../dataProvider';
import ExcelJS from 'exceljs';
import { transformWashesForShow } from './utils';
import dayjs from 'dayjs';
import { formDateFormat, saveXLSX } from 'shared/lib';
import { useState } from 'react';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export const SaveWashesAsExcelButton = () => {
    const [isExporting, setIsExporting] = useState(false);

    const onClick = async () => {
        try {
            setIsExporting(true);
            await saveWashesAsExcel();
        } catch (error) {
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={onClick}
            style={{ marginLeft: 'auto' }}
            icon={isExporting ? <LoadingOutlined spin /> : <DownloadOutlined />}
        >
            Скачать
        </Button>
    );
};

const saveWashesAsExcel = async () => {
    const { data = [] } = await dataProvider.getList<WashEntity>({
        resource: 'washes'
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Washes');

    const header = [
        'ID',
        'Позывной',
        'ФИО',
        'Службы/Локации',
        'Дней на поле',
        'Дата стирки',
        'Номер стирки',
        'Позывной совы'
    ];

    sheet.addRow(header);

    data.forEach((washItem) => {
        const itemForSave = transformWashesForShow(washItem);

        const { id, volunteerName, volunteerFullName, daysOnField, directions, washDate, washCount, owlName } =
            itemForSave;

        sheet.addRow([
            id,
            volunteerName,
            volunteerFullName,
            directions?.join(',') ?? '',
            daysOnField,
            dayjs(washDate).format(formDateFormat),
            washCount,
            owlName
        ]);
    });

    await saveXLSX(workbook, 'Washes');
};
