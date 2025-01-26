import { Divider } from 'antd';
import { FC, memo, useCallback, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import sas from 'onscan.js';

import { isBrowser } from 'utils';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';

import css from './qr-scan.module.css';

if (isBrowser) {
    sas.attachTo(document, {
        suffixKeyCodes: [13], // enter-key expected at the end of a scan
        reactToPaste: false,
        minLength: 8,
        captureEvents: true,
        keyCodeMapper: (e: KeyboardEvent) => String.fromCharCode(e.keyCode).toLowerCase()
    });
}

const Video1: FC<{ setRef: (ref: HTMLVideoElement) => void }> = memo(
    ({ setRef }) => <video className={css.qrScanVideo} ref={setRef} style={{ width: '50%' }} />,
    () => true
);
Video1.displayName = 'Video1';

export const Dashboard: FC = () => {
    const scanner = useRef<QrScanner | null>(null);
    const video = useRef<HTMLVideoElement | null>(null);
    const loadingRef = useRef(false);

    const onScan = useCallback(async (qr: string) => {
        if (loadingRef.current) return;

        console.log('qr', qr);
        loadingRef.current = true;

        try {
            const { data } = await axios.get(`${NEW_API_URL}/volunteers/`, { params: { qr } });
            console.log('volunteers by qr', data);

            if (!data.results.length) {
                alert('Волонтер не найден');
            } else {
                window.location.href = `${window.location.href}volunteers/edit/${data.results[0].id}`;
            }
        } catch (e) {
            console.log(e);
            alert(`Ошибка поиска волонтера: ${e}`);
        } finally {
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!video.current) return;

        const s = new QrScanner(video.current, ({ data }) => void onScan(data.replace(/[^A-Za-z0-9]/g, '')), {
            onDecodeError: () => {},
            highlightScanRegion: true,
            highlightCodeOutline: true
        });

        scanner.current = s;
        void s.start();

        return () => s.destroy();
    }, [onScan]);

    const onVideoReady = (ref: HTMLVideoElement) => {
        video.current = ref;
    };
    useEffect(() => {
        const onHardwareScan = ({ detail: { scanCode } }: { detail: { scanCode: string } }): void => {
            void onScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        };

        document.addEventListener('scan', onHardwareScan);
        return () => document.removeEventListener('scan', onHardwareScan);
    }, [onScan]);

    return (
        <>
            <Divider orientation="center">ОТСКАНИРУЙ БЕЙДЖ</Divider>
            <div style={{ textAlign: 'center' }}>
                <Video1 setRef={onVideoReady} />
            </div>
        </>
    );
};
