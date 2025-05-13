import { FC, memo, useCallback, useEffect, useRef } from 'react';

import css from './qr-scanner-component.module.css';
import { ScannerController } from './types';

const CameraScreen: FC<{ setRef: (ref: HTMLVideoElement) => void }> = memo(
    ({ setRef }) => <video className={css.qrScanVideo} ref={setRef} disablePictureInPicture playsInline muted />,
    () => true
);
CameraScreen.displayName = 'CameraScreen';

export interface QrScannerComponentProps {
    scannerController: ScannerController;
}

export const QrScannerComponent: FC<QrScannerComponentProps> = memo(({ scannerController }) => {
    const { scannerInstance, setScannerInstance, createScanner, handleScan } = scannerController;

    const video = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const onHardwareScan = ({ detail: { scanCode } }: { detail: { scanCode: string } }) => {
            void handleScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        };

        document.addEventListener('scan', onHardwareScan);
        return () => document.removeEventListener('scan', onHardwareScan);
    }, [handleScan]);

    useEffect(() => {
        return () => {
            if (scannerInstance) {
                scannerInstance.destroy();
                setScannerInstance(null);
            }
        };
    }, [scannerInstance, setScannerInstance]);

    const onCameraScreenReady = useCallback(
        (ref: HTMLVideoElement | null) => {
            if (!ref) return;

            video.current = ref;
            if (!scannerInstance) {
                createScanner(ref);
            }
        },
        [createScanner, scannerInstance]
    );

    return (
        <div style={{ textAlign: 'center' }}>
            <CameraScreen setRef={onCameraScreenReady} />
        </div>
    );
});
