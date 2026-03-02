import { Divider, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useScreen } from 'shared/providers';
import { QrScannerComponent } from 'shared/components/qr-scanner-component';
import { PostScan } from '../components/post-scan';
import { useScannerController } from 'shared/components/qr-scanner-component/hooks/useScannerController';

const SPINNER_TIMEOUT = 3000;

const MobileSpinnerGate = ({ timeoutMs, children }: { timeoutMs: number; children: ReactNode }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const id = window.setTimeout(() => setShow(false), timeoutMs);
        return () => window.clearTimeout(id);
    }, [timeoutMs]);

    if (show) {
        return (
            <div style={{ display: 'flex', height: '50vh', justifyContent: 'center' }}>
                <Spin indicator={<LoadingOutlined spin />} style={{ marginTop: 'auto' }} />
            </div>
        );
    }

    return <>{children}</>;
};

export const Wash = () => {
    const { isDesktop } = useScreen();
    const [scannedVolunteerQr, setScannedVolunteerQr] = useState<string | undefined>();

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

    const content = useMemo(
        () => (
            <>
                <Divider orientation="center">ОТСКАНИРУЙ БЕЙДЖ</Divider>
                <QrScannerComponent scannerController={scannerController} />

                {scannedVolunteerQr && <PostScan volunteerQr={scannedVolunteerQr} onClose={handleClosePostScan} />}
            </>
        ),
        [handleClosePostScan, scannedVolunteerQr, scannerController]
    );

    if (isDesktop) return content;

    return (
        <MobileSpinnerGate key="mobile" timeoutMs={SPINNER_TIMEOUT}>
            {content}
        </MobileSpinnerGate>
    );
};
