import { useState } from 'react';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import { downloadBlob, getFilenameFromContentDisposition } from 'shared/lib/saveXLSX';

export const SaveWashesAsExcelButton = () => {
    const [isExporting, setIsExporting] = useState(false);

    const onClick = async () => {
        try {
            setIsExporting(true);

            const { data, headers } = await axios.get<Blob>(`${NEW_API_URL}/washes/export-xlsx/`, {
                responseType: 'blob'
            });

            const filename = getFilenameFromContentDisposition(headers['content-disposition'], 'washes.xlsx');
            downloadBlob(data, filename);
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
