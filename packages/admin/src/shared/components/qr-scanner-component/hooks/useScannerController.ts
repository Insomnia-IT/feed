import QrScanner from 'qr-scanner';
import { useCallback, useRef, useState } from 'react';
import type { ScannerControllerProps } from '../types';

export const useScannerController = ({ onScan }: ScannerControllerProps) => {
    const [scannerInstance, setScannerInstance] = useState<QrScanner | null>(null);

    const disabledScanRef = useRef(false);

    const enableScan = useCallback(() => {
        disabledScanRef.current = false;
    }, []);

    const disableScan = useCallback(() => {
        disabledScanRef.current = true;
    }, []);

    const handleScan = useCallback(
        async (qr: string) => {
            if (disabledScanRef.current) return;

            await onScan(qr, { enableScan, disableScan });
        },
        [disableScan, onScan, enableScan]
    );

    const createScanner = useCallback(
        (videoElement: HTMLVideoElement) => {
            const scanner = new QrScanner(
                videoElement,
                ({ data }) => void handleScan(data.replace(/[^A-Za-z0-9]/g, '')),
                {
                    onDecodeError: () => {},
                    highlightScanRegion: true,
                    highlightCodeOutline: true
                }
            );
            setScannerInstance(scanner);
            void scanner.start();
            return scanner;
        },
        [handleScan]
    );

    return {
        handleScan,
        createScanner,
        scannerInstance,
        setScannerInstance,
        enableScan,
        disableScan
    };
};
