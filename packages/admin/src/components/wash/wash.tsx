import { Divider } from 'antd';
import { FC, useCallback, useState } from 'react';

import { QrScannerComponent } from 'components/qr-scanner-component';
import { PostScan } from './components/post-scan';
import { useScannerController } from 'components/qr-scanner-component/hooks/useScannerController';

export const Wash: FC = () => {
    const [scannedVolunteerQr, setScannedVolunteerQr] = useState<string | undefined>(
        // FIXME
        '519daac58cf54fb4bea6962946478f0f'
    );

    const scannerController = useScannerController({
        onScan: async (qr: string, { disableScan }) => {
            disableScan();
            setScannedVolunteerQr(qr);
        }
    });

    const handleClosePostScan = useCallback(() => {
        setScannedVolunteerQr(undefined);
        scannerController.enableScan();
    }, [scannerController]);

    return (
        <>
            <Divider orientation="center">ОТСКАНИРУЙ БЕЙДЖ</Divider>
            <QrScannerComponent scannerController={scannerController} />

            {scannedVolunteerQr && <PostScan volunteerQr={scannedVolunteerQr} onClose={handleClosePostScan} />}
        </>
    );
};
