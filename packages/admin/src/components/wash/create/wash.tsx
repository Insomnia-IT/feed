import { Divider } from 'antd';
import { FC, useCallback, useEffect, useState } from 'react';

import { QrScannerComponent } from 'components/qr-scanner-component';
import { PostScan } from '../components/post-scan';
import { useScannerController } from 'components/qr-scanner-component/hooks/useScannerController';
import { useIsMobile } from 'shared/hooks';
import { SpinLoading } from 'antd-mobile';

const SPINNER_TIMEOUT = 3000;

export const Wash: FC = () => {
    const { isMobile } = useIsMobile();
    const [showSpinner, setShowSpinner] = useState(false);
    const [scannedVolunteerQr, setScannedVolunteerQr] = useState<string | undefined>();

    useEffect(() => {
        if (isMobile) {
            setShowSpinner(true);
            setTimeout(() => setShowSpinner(false), SPINNER_TIMEOUT);
        }
    }, [isMobile]);

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

    if (isMobile && showSpinner) {
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
