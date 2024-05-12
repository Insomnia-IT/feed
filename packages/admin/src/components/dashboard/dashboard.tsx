import { Divider } from '@pankod/refine-antd';
import React, { memo, useCallback, useEffect, useRef } from 'react';
// import { /*getDefaultFilter,*/ useList, useSelect, useUpdate } from '@pankod/refine-core';
import { isBrowser } from '@feed/core/src/const';
import QrScanner from 'qr-scanner';

import { axios } from '~/authProvider';
import { NEW_API_URL } from '~/const';
// import type { VolEntity } from 'interfaces';

import css from './qr-scan.module.css';

// const { Content, Footer, Header, Sider } = Layout;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sas = require('onscan.js/onscan');

if (isBrowser) {
    // @ts-ignore
    sas.attachTo(document, {
        suffixKeyCodes: [13], // enter-key expected at the end of a scan
        reactToPaste: false,
        minLength: 8,
        captureEvents: true,
        keyCodeMapper: (e: KeyboardEvent) => String.fromCharCode(e.keyCode).toLowerCase()
    });
}

const Video1: FC<{
    setRef: (ref: HTMLVideoElement) => void;
}> = memo(
    ({ setRef }) => <video className={css.qrScanVideo} ref={setRef} style={{ width: '50%' }} />,
    () => true
);
Video1.displayName = 'Video1';

export const Dashboard: FC = () => {
    // const vo = {};
    // const { data, isLoading } = useList<VolEntity>({
    //     resource: 'volunteers',
    //     config: {
    //         /*filters: [
    //             {
    //                 field: 'status',
    //                 operator: 'eq',
    //                 value: 'draft'
    //             }
    //         ],*/
    //         // pagination: { pageSize: 1 }
    //     }
    // });

    // console.log(data);
    // const mutationResult = useUpdate<VolEntity>();

    // const selectProps = useSelect<VolEntity>({
    //     resource: 'volunteers',
    //     optionLabel: 'name',
    //     optionValue: 'id'
    //     // defaultValue: getDefaultFilter('category.id', filters, 'in')
    // });

    // const { isLoading: /*mutateIsLoading,*/ mutate } = mutationResult;

    const scanner = useRef<QrScanner | null>(null);
    const video = useRef<HTMLVideoElement | null>(null);

    const loadingRef = useRef(false);

    const onScan = useCallback(async (qr: string) => {
        if (loadingRef.current) {
            return;
        }
        console.log('qr', qr);

        try {
            loadingRef.current = true;
            const { data } = await axios.get(`${NEW_API_URL}/volunteers/`, {
                params: {
                    qr
                }
            });

            console.log('volunteers by qr', data);

            if (!data.results.length) {
                alert(`Волонтер не найден`);
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

        const s = new QrScanner(
            video.current,
            ({ data }) => {
                // setError(null);
                // console.log(`read: ${data}`);
                void onScan(data.replace(/[^A-Za-z0-9]/g, ''));
                // console.log(`qr: ${data}`);
                // onScan(data);
            },
            {
                onDecodeError: () => {
                    // no handle
                },
                // maxScansPerSecond: 1,
                highlightScanRegion: true,
                highlightCodeOutline: true
            }
        );

        scanner.current = s;

        void s.start();

        return () => {
            s.destroy();
        };
    }, [onScan]);

    const onVideoReady = (ref: HTMLVideoElement) => {
        video.current = ref;
    };

    useEffect(() => {
        // @ts-ignore
        function onHardwareScan({ detail: { scanCode } }): void {
            void onScan(scanCode.replace(/[^A-Za-z0-9]/g, ''));
        }

        // @ts-ignore
        document.addEventListener('scan', onHardwareScan);

        return (): void => {
            // @ts-ignore
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [onScan]);

    /*
    const handleUpdate = (item: ICompany, status: string): void => {
        mutate({ resource: 'volunteers', id: item.id, values: { ...item, status } });
    };
*/

    return (
        <>
            <Divider orientation='center'>ОТСКАНИРУЙ БЕЙДЖ</Divider>
            {/* {isLoading && <Spin size='large' />} */}
            {/* <Select showSearch placeholder='привязать к волонтеру' {...selectProps} /> */}
            <div style={{ textAlign: 'center' }}>
                <Video1 setRef={onVideoReady} />
            </div>
        </>
    );
};
