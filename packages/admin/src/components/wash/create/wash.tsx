import { Button, Divider } from 'antd';
import { FC, useCallback, useState } from 'react';

import { QrScannerComponent } from 'components/qr-scanner-component';
import { PostScan } from '../components/post-scan';
import { useScannerController } from 'components/qr-scanner-component/hooks/useScannerController';
import { useIsMobile } from 'shared/hooks';

// Если не обновлять страницу - должно показать кнопку только один раз
let showScanner = false;

export const Wash: FC = () => {
    const { isMobile } = useIsMobile();
    const [scannedVolunteerQr, setScannedVolunteerQr] = useState<string | undefined>();
    const [showScannerInner, setShowScannerInner] = useState(showScanner);

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

    if (isMobile && !showScannerInner) {
        return (
            <div style={{ display: 'flex', height: '50vh', justifyContent: 'center' }}>
                <Button
                    style={{ marginTop: 'auto' }}
                    onClick={() => {
                        setShowScannerInner(true);
                        showScanner = true;
                    }}
                >
                    Нажми для скана
                </Button>
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
