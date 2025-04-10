import fs from 'file-saver';

export async function saveXLSX(
    workbook: { xlsx: { writeBuffer: () => Promise<ArrayBuffer> } },
    tableName: string
): Promise<void> {
    const data = await workbook.xlsx.writeBuffer();
    const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    fs.saveAs(blob, `${tableName}.xlsx`);
}
