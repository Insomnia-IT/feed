import React, { useCallback, useContext, useEffect, useState } from 'react';
import cn from 'classnames';

import { ErrorMsg, LastUpdated } from '~/components/misc/misc';
import { PostScan } from '~/components/post-scan';
import { QrScan } from '~/components/qr-scan';
import { BtnSync } from '~/components/btn-sync';
import { db } from '~/db';
import { AppContext } from '~/app-context';
import { MainScreenStats } from '~/components/main-screen-stats';
import { ScanSimulator } from '~/components/qr-scan-simulator';

import css from '../app.module.css';

export const MainScreen = React.memo(function MainScreen() {
    const { appError, isDev, lastUpdate, setColor, setLastUpdated, setVolCount, volCount } = useContext(AppContext);
    const [scanResult, setScanResult] = useState('');

    const closeFeedDialog = useCallback(() => {
        setColor(null);
        setScanResult('');
    }, []);

    const feedAnon = useCallback(() => {
        setScanResult('anon');
    }, []);

    useEffect(() => {
        void db.volunteers.count().then((c) => setVolCount(c));
        setLastUpdated(Number(localStorage.getItem('lastUpdated')));
    }, []);

    return (
        <div className={cn(css.screen, css.main)}>
            <BtnSync />
            <div className={cn(css.screen, css.main)} style={{ display: scanResult ? 'none' : '' }}>
                {isDev && <ScanSimulator withSelection setScanResult={setScanResult} />}
                <QrScan onScan={setScanResult} />
                <button className={css.anon} onClick={feedAnon}>
                    Кормить Анонима
                </button>
            </div>
            {scanResult && <PostScan closeFeed={closeFeedDialog} qrcode={scanResult} />}

            {appError && <ErrorMsg close={closeFeedDialog} msg={appError} />}
            <LastUpdated count={volCount} ts={lastUpdate || 0} />
            <MainScreenStats />
        </div>
    );
});
