import QrScanner from 'qr-scanner';
import type { Dispatch } from 'react';

export interface ScannerController {
    handleScan: (qr: string) => Promise<void>;
    createScanner: (videoElement: HTMLVideoElement) => QrScanner;
    scannerInstance: QrScanner | null;
    setScannerInstance: Dispatch<QrScanner | null>;
    enableScan: () => void;
    disableScan: () => void;
}

export interface ScannerControllerProps {
    onScan: (qr: string, utils: { enableScan: () => void; disableScan: () => void }) => Promise<void>;
}
