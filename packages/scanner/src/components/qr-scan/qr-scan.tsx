import type { CSSProperties, FC } from 'react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import sas from 'onscan.js';

import { useApp } from 'model/app-provider';

import css from './qr-scan.module.css';

sas.attachTo(document, {
    suffixKeyCodes: [13], // enter-key expected at the end of a scan
    reactToPaste: false,
    minLength: 8,
    captureEvents: true,
    keyCodeMapper: (e: KeyboardEvent) => String.fromCharCode(e.keyCode).toLowerCase()
});

const Video1: React.FC<{
    setRef: (ref: HTMLVideoElement) => void;
}> = memo(
    ({ setRef }) => <video className={css.qrScanVideo} ref={setRef} />,
    () => true
);
Video1.displayName = 'Video1';

export const QrScan: FC<{
    style?: CSSProperties;
    onScan: (v: string) => void;
}> = memo(({ onScan, style }) => {
    const scanner = useRef<QrScanner | null>(null);
    const video = useRef<HTMLVideoElement | null>(null);

    const [, setHasFlash] = useState<boolean>(false);
    const { setError } = useApp();

    const updateFlashAvailability = useCallback(() => {
        if (scanner.current) {
            void scanner.current.hasFlash().then((hasFlash: boolean) => {
                setHasFlash(hasFlash);
            });
        }
    }, []);

    const onVideoReady = (ref: HTMLVideoElement) => {
        video.current = ref;
    };

    useEffect(() => {
        if (!video.current) return;

        console.log('QrScanner');

        const s = new QrScanner(
            video.current,
            ({ data }) => {
                setError(null);
                console.log(`read: ${data}`);
                onScan(data.replace(/[^A-Za-z0-9]/g, ''));
            },
            {
                maxScansPerSecond: 1,
                // highlightScanRegion: true,
                highlightCodeOutline: true
            }
        );

        scanner.current = s;

        void s.start().then(() => {
            updateFlashAvailability();
        });

        return () => {
            s.destroy();
        };
    }, [onScan, setError, updateFlashAvailability]);

    useEffect(() => {
        function onHardwareScan(e: CustomEvent<{ scanCode: string }>): void {
            const scanCode = e?.detail?.scanCode;
            onScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [onScan]);

    return (
        <div className={css.qr} style={style}>
            <Video1 setRef={onVideoReady} />
        </div>
    );
});
QrScan.displayName = 'QrScan';
