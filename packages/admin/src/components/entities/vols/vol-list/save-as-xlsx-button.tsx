import { Button } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { FC, useState } from 'react';
import axios from 'axios';

import { NEW_API_URL } from 'const';
import { downloadBlob, getFilenameFromContentDisposition } from 'shared/lib/saveXLSX';

export const SaveAsXlsxButton: FC<{
    isDisabled: boolean;
    filterQueryParams: string;
}> = ({ filterQueryParams, isDisabled }) => {
    const [isExporting, setIsExporting] = useState(false);

    const onClick = async (): Promise<void> => {
        setIsExporting(true);

        try {
            const { data, headers } = await axios.get<Blob>(
                `${NEW_API_URL}/volunteers/export-xlsx/${filterQueryParams}`,
                {
                    responseType: 'blob'
                }
            );

            const filename = getFilenameFromContentDisposition(headers['content-disposition'], 'volunteers.xlsx');
            downloadBlob(data, filename);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            shape={'default'}
            type={'primary'}
            onClick={() => {
                void onClick();
            }}
            icon={isExporting ? <LoadingOutlined spin /> : <DownloadOutlined />}
            disabled={isDisabled}
        >
            Выгрузить
        </Button>
    );
};
