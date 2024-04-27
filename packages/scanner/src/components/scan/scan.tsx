import React, { useCallback, useContext } from 'react';

import { IconButton } from '~/shared/ui/icon-button/icon-button';
import { Clock } from '~/shared/ui/icons/clock';
import { mealTimes } from '~/shared/lib/utils';
import { GearAlt } from '~/shared/ui/icons/gear-alt';
import { Button } from '~/shared/ui/button/button';
import { QrScan } from '~/components/qr-scan';
import { AppContext } from '~/app-context';
import { MainScreenStats } from '~/components/main-screen-stats';

import css from './scan.module.css';

interface ScanProps {
    onScan: (value: string) => void;
}

export const Scan = (props: ScanProps) => {
    const { onScan } = props;

    const { mealTime } = useContext(AppContext);

    const feedAnon = () => {
        onScan('anon');
    };

    const handleScan = useCallback((value: string) => {
        onScan(value);
    }, []);

    return (
        <div className={css.scan}>
            <div className={css.head}>
                <IconButton>
                    <Clock color='white' />
                </IconButton>
                <p className={css.mealTimeText}>{mealTime ? mealTimes[mealTime] : ''}</p>
                <IconButton>
                    <GearAlt color='white' />
                </IconButton>
            </div>
            <Button className={css.anonButton} onClick={feedAnon}>
                Кормить Анонима
            </Button>
            <div className={css.overlay}></div>
            {/*<BtnSync />*/}
            <div className={css.scan}>
                {/*{(isDev || debugMode === '1') && <ScanSimulator withSelection setScanResult={setScanResult} />}*/}
                <QrScan onScan={handleScan} />
            </div>
            <MainScreenStats />
        </div>
    );
};
