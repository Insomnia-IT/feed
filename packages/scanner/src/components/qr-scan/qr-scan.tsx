import type { CSSProperties, FC } from 'react';
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import sas from 'onscan.js/onscan';

import { AppContext } from '~/app-context';
import { ReactComponent as Flash } from '~/icons/flash.svg';

import css from './qr-scan.module.css';

// @ts-ignore
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

    const [hasFlash, setHasFlash] = useState<boolean>(false);
    const { setError } = useContext(AppContext);

    const updateFlashAvailability = useCallback(() => {
        scanner.current &&
            void scanner.current.hasFlash().then((hasFlash: boolean) => {
                setHasFlash(hasFlash);
            });
    }, []);

    const onVideoReady = (ref: HTMLVideoElement) => {
        video.current = ref;
    };

    useEffect(() => {
        if (!video.current) return;

        const s = new QrScanner(
            video.current,
            ({ data }) => {
                setError(null);
                console.log(`read: ${data}`);
                onScan(data.replace(/[^A-Za-z0-9]/g, ''));
            },
            {
                maxScansPerSecond: 1,
                highlightScanRegion: true,
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

    const toggleFlash = useCallback((): void => {
        scanner.current && void scanner.current.toggleFlash();
    }, [scanner]);

    useEffect(() => {
        // @ts-ignore
        function onHardwareScan({ detail: { scanCode } }): void {
            onScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        // @ts-ignore
        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            // @ts-ignore
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [onScan]);

    return (
        <div className={css.qr} style={style}>
            <Video1 setRef={onVideoReady} />
            <button className={css.flash} disabled={!hasFlash} onClick={toggleFlash}>
                <Flash />
            </button>
        </div>
    );
});
QrScan.displayName = 'QrScan';
