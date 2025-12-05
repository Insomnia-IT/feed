import { Divider } from 'antd';
import { FC, useCallback, useEffect, useState } from 'react';
import { SpinLoading } from 'antd-mobile';

import { useScreen } from 'shared/providers';
import { QrScannerComponent } from 'shared/components/qr-scanner-component';
import { PostScan } from '../components/post-scan';
import { useScannerController } from 'shared/components/qr-scanner-component/hooks/useScannerController';

const SPINNER_TIMEOUT = 3000;

export const Wash: FC = () => {
    const { isDesktop } = useScreen();
    const [showSpinner, setShowSpinner] = useState(false);
    const [scannedVolunteerQr, setScannedVolunteerQr] = useState<string | undefined>();

    useEffect(() => {
        if (!isDesktop) {
            setShowSpinner(true);
            setTimeout(() => setShowSpinner(false), SPINNER_TIMEOUT);
        }
    }, [isDesktop]);

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

    if (!isDesktop && showSpinner) {
        return (
            <div style={{ display: 'flex', height: '50vh', justifyContent: 'center' }}>
                <SpinLoading style={{ marginTop: 'auto' }} />
            </div>
        );
    }

    return (
        <>
            <Divider orientation="center">ОТСКАНИРУЙ БЕЙДЖ</Divider>
            <QrScannerComponent scannerController={scannerController} />

            {scannedVolunteerQr && <PostScan volunteerQr={scannedVolunteerQr} onClose={handleClosePostScan} />}
        </>
    );
};
