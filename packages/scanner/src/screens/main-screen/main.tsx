import React, { useCallback, useEffect, useState } from 'react';

import { LastUpdated } from '~/components/misc/misc';
import { PostScan } from '~/components/post-scan';
import { db } from '~/db';
import { Scan } from '~/components/scan/scan';
import { useApp } from '~/model/app-provider';
import { ErrorCard } from '~/components/post-scan-cards/error-card';

import css from './main.module.css';

export const MainScreen = React.memo(function MainScreen() {
    const { appError, lastSyncStart, setColor, setLastSyncStart, setVolCount, volCount } = useApp();
    const [scanResult, setScanResult] = useState('');
    const closeFeedDialog = useCallback(() => {
        setColor(null);
        setScanResult('');
    }, []);

    useEffect(() => {
        void db.volunteers.count().then((c) => setVolCount(c));
        setLastSyncStart(Number(localStorage.getItem('lastSyncStart')));
    }, []);

    return (
        <div className={css.main}>
            {!scanResult && <Scan onScan={setScanResult} />}
            {scanResult && <PostScan closeFeed={closeFeedDialog} qrcode={scanResult} />}
            {appError && <ErrorCard close={closeFeedDialog} msg={appError} />}
            {/*<LastUpdated count={volCount} ts={lastSyncStart || 0} />*/}
        </div>
    );
});
