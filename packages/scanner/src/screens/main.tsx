import cn from 'classnames';

import { ErrorMsg, LastUpdated } from '~/components/misc/misc';
import { PostScan } from '~/components/post-scan';
import { QrScan } from '~/components/qr-scan';
import { BtnSync } from '~/components/btn-sync';
import { db } from '~/db';

import css from '../app.module.css';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '~/app-context';

export const MainScreen = () => {
    const { setLastUpdated, setColor, setVolCount, appError, lastUpdate, volCount } = useContext(AppContext);
    const [scanResult, setScanResult] = useState('');

    const closeFeedDialog = useCallback(() => {
        setColor(null);
        setScanResult('');
    }, []);

    useEffect(() => {
        void db.volunteers.count().then((c) => setVolCount(c));
        setLastUpdated(Number(localStorage.getItem('lastUpdated')));
    }, []);

    return (
        <div className={cn(css.screen, css.main)}>
            <BtnSync />
            {!scanResult && <QrScan onScan={setScanResult} />}
            {scanResult && <PostScan closeFeed={closeFeedDialog} qrcode={scanResult} />}
            {appError && <ErrorMsg close={closeFeedDialog} msg={appError} />}
            <LastUpdated count={volCount} ts={lastUpdate || 0} />
        </div>
    );
};
