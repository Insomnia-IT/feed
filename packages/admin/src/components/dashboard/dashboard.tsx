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
    //     optionLabel: 'nickname',
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
            loadingRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (!video.current) return;

        const s = new QrScanner(
            video.current,
            ({ data }) => {
                // setError(null);
                // console.log(`read: ${data}`);
                debugger;
                void onScan(data);
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
            scanCode = scanCode.replace(/[^A-Za-z0-9]/g, '');
            void onScan(scanCode);
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
            {/*
                <div className="details">
                    <h2>{{vo.name}} ({{vo.nickname}})</h2>
                    <h4>КОД: {{vo.qr}}</h4>
                </div>
                <ul className="details">
                    {% if vo.is_blocked %}
                    <li className="blocked">Заблокирован</li>
                    {% endif %}
                    <li>Питание: <span className="feedType">{{vo.feed_type}}</span></li>
                    <li>Баланс: <span className="feedType">{{vo.daily_eats}}</span></li>
                    {% if vo.is_active %}
                    <li>Статус: <span className="feedType">Зарегистрирован</span></li>
                    {% endif %}
                    {% if not vo.is_active %}
                    <li>Статус: <span className="feedType">Не зарегистрирован</span></li>
                    {% endif %}
                    {% if vo.active_from or vo.active_to %}
                    <li>{{vo.active_from}} - {{vo.active_to}}</li>
                    {% endif %}
                    {% if vo.position %}
                    <li>{{vo.position}}</li>
                    {% endif %}
                    {% if vo.department %}
                    <li>{{vo.department}}</li>
                    {% endif %}
                    {% if vo.location %}
                    <li>{{vo.location}}</li>
                    {% endif %}
                </ul>
                <div className="center">
                    {% if not vo.is_active %}
                    <button type="button" className="btn btn-success" onClick="registerOnly({{ vo.id }})">
                        Зарегистрировать
                    </button>
                    {% endif %}
                    <button type="button" className="btn btn-danger" onClick="blockOnly({{ vo.id }})">
                        Заблокировать
                    </button>
                </div>
                <div className="center">
                    <form className="registerParams" id="registerParams">
                        <fieldset>
                            <label htmlFor="datepicker">До</label>
                            <input id="datepicker" width="276"/>
                        </fieldset>
                        <fieldset>
                            <label htmlFor="feedType">Тип</label>
                            <select id="feedType">
                                <option value=""></option>
                                <option value="FT2" {{'selected' if vo.feed_type_id == 2 else ''}}>платно</option>
                                <option value="FT1" {{'selected' if vo.feed_type_id == 1 else ''}}>фри</option>
                            </select>
                        </fieldset>
                        <button type="button" className="btn btn-success" onClick="registerWithParams({{ vo.id }})">
                            Зарегистрировать
                        </button>
                        <button type="button" className="btn btn-success"
                                onClick="registerWithParams({{ vo.id }}, true)">
                            Регистрировать и редактировать
                        </button>
                    </form>
                </div>
                <button type="button" className="btn btn-success" onClick="editVol()">Редактировать</button>
                <button type="button" className="btn btn-warning" onClick="go('/admin/')">Назад</button>
                <button type="button" className="btn btn-success" onClick="volFeedHistory()">История</button>
*/}
        </>
    );
};
